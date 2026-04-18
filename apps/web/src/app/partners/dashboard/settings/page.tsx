'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const PARTNER_SERVICES = [
  { value: 'MATCHMAKER',   label: 'Matchmaker',     icon: '💑' },
  { value: 'PHOTOGRAPHER', label: 'Photographer',    icon: '📸' },
  { value: 'VIDEOGRAPHER', label: 'Videographer',    icon: '🎬' },
  { value: 'VENUE',        label: 'Venue',           icon: '🏛️' },
  { value: 'CATERING',     label: 'Catering',        icon: '🍽️' },
  { value: 'MAKEUP_ARTIST',label: 'Makeup Artist',   icon: '💄' },
  { value: 'FLORIST',      label: 'Florist',         icon: '💐' },
  { value: 'DJ_MUSIC',     label: 'DJ / Music',      icon: '🎵' },
  { value: 'CAKE_DESIGNER',label: 'Cake Designer',   icon: '🎂' },
  { value: 'TRANSPORT',    label: 'Transport',       icon: '🚗' },
  { value: 'OTHER',        label: 'Other',           icon: '✨' },
];

interface PartnerData {
  businessName: string;
  businessEmail: string;
  contactPerson: string;
  website: string;
  bio: string;
  yearsOfExperience: string;
  phone: string;
  whatsapp: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #F0E4D0', background: 'white',
  fontSize: 13, color: '#2A1A1A', outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Outfit',sans-serif",
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5A4A3A', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: '#9A8A7A', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.4)',
      borderTop: '2px solid white',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );
}

export default function PartnerSettingsPage() {
  const { token } = useAuthStore();
  const [form, setForm] = useState<PartnerData>({
    businessName: '', businessEmail: '', contactPerson: '',
    website: '', bio: '', yearsOfExperience: '',
    phone: '', whatsapp: '',
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [servicesError, setServicesError] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function showFlash(type: 'success' | 'error', message: string) {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ type, message });
    if (type === 'success') flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }

  function set(key: keyof PartnerData, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleService(val: string) {
    setServicesError('');
    setSelectedServices(prev =>
      prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
    );
  }

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/partners/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.partner) {
          const p = d.partner;
          const primaryPhone = p.phones?.find((ph: any) => ph.label === 'Primary')?.number ?? '';
          const waPhone = p.phones?.find((ph: any) => ph.label === 'WhatsApp')?.number ?? '';
          setForm({
            businessName: p.businessName ?? '',
            businessEmail: p.businessEmail ?? '',
            contactPerson: p.contactPerson ?? '',
            website: p.website ?? '',
            bio: p.bio ?? '',
            yearsOfExperience: p.yearsOfExperience?.toString() ?? '',
            phone: primaryPhone,
            whatsapp: waPhone,
          });
          if (p.bannerPath) setBannerUrl(p.bannerPath);
          if (p.logoImage) setLogoUrl(p.logoImage);
          if (p.types?.length) setSelectedServices(p.types.map((t: any) => t.type));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleImageUpload(file: File, type: 'banner' | 'logo') {
    if (!token) return;
    const setUploading = type === 'banner' ? setUploadingBanner : setUploadingLogo;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      const res = await fetch(`${API}/api/partners/me/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      if (type === 'banner') setBannerUrl(data.url);
      else setLogoUrl(data.url);
      showFlash('success', `${type === 'banner' ? 'Banner' : 'Logo'} uploaded successfully!`);
    } catch (err: any) {
      showFlash('error', err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName.trim()) { showFlash('error', 'Business name is required'); return; }
    if (!form.businessEmail.trim()) { showFlash('error', 'Business email is required'); return; }
    if (selectedServices.length === 0) { setServicesError('Select at least one service'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/partners/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessName: form.businessName,
          businessEmail: form.businessEmail,
          contactPerson: form.contactPerson,
          website: form.website,
          bio: form.bio,
          yearsOfExperience: form.yearsOfExperience || null,
          phone: form.phone,
          whatsapp: form.whatsapp,
          services: selectedServices,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      showFlash('success', 'Your information has been updated successfully!');
      window.dispatchEvent(new Event('partner-updated'));
    } catch (err: any) {
      showFlash('error', err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>
      Loading…
    </div>
  );

  const avatarLetter = (form.businessName || form.contactPerson || 'P')[0]?.toUpperCase() ?? 'P';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.7rem', fontWeight: 800, color: '#2A1A1A', margin: 0, marginBottom: 6 }}>
          My Business Info
        </h1>
        <p style={{ fontFamily: "'Outfit',sans-serif", color: '#7A6A5A', fontSize: '0.88rem', margin: 0 }}>
          Update your partner account details and contact information.
        </p>
      </div>

      {/* Flash banner */}
      {flash && (
        <div style={{
          position: 'sticky', top: 12, zIndex: 200, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', borderRadius: 14,
          background: flash.type === 'success' ? 'linear-gradient(135deg,#D1FAE5,#A7F3D0)' : 'linear-gradient(135deg,#FEE2E2,#FECACA)',
          border: `1.5px solid ${flash.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
          boxShadow: flash.type === 'success' ? '0 4px 20px rgba(74,190,170,0.2)' : '0 4px 20px rgba(232,115,90,0.2)',
        }}>
          <span style={{ fontSize: 20 }}>{flash.type === 'success' ? '✅' : '⚠️'}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: flash.type === 'success' ? '#065F46' : '#7F1D1D', fontFamily: "'Outfit',sans-serif" }}>{flash.message}</span>
          <button onClick={() => setFlash(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: 0.5, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* Business Images */}
      <div style={{ background: 'white', borderRadius: 18, border: '1px solid #F0E4D0', padding: '24px 26px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #F4A435', display: 'inline-block' }}>
          🖼️ Business Images
        </div>

        {/* Banner */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5A4A3A', marginBottom: 8 }}>Banner Image</div>
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt="Business banner"
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, display: 'block', marginBottom: 10 }}
            />
          ) : (
            <div style={{
              width: '100%', height: 200, borderRadius: 12, marginBottom: 10,
              border: '2px dashed #F0E4D0', background: '#FFFBF7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontSize: 28, opacity: 0.4 }}>🏞️</span>
              <span style={{ fontSize: 13, color: '#9A8A7A' }}>No banner uploaded</span>
            </div>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'banner'); e.target.value = ''; }}
          />
          <button
            type="button"
            disabled={uploadingBanner}
            onClick={() => bannerInputRef.current?.click()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 22px', borderRadius: 50,
              background: uploadingBanner ? '#F0E4D0' : 'linear-gradient(135deg,#F4A435,#E8735A)',
              color: uploadingBanner ? '#9A8A7A' : 'white',
              border: 'none', fontSize: 13, fontWeight: 600,
              cursor: uploadingBanner ? 'not-allowed' : 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            {uploadingBanner ? <><Spinner /> Uploading…</> : '📤 Upload Banner'}
          </button>
          <span style={{ fontSize: 11, color: '#9A8A7A', marginLeft: 10 }}>Recommended: 1200 × 400px, max 8MB</span>
        </div>

        {/* Logo */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5A4A3A', marginBottom: 8 }}>Logo / Profile Picture</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Business logo"
                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #F4A435', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 100, height: 100, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#F4A435,#E8735A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 36,
                border: '3px solid #F4A435',
              }}>
                {avatarLetter}
              </div>
            )}
            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'logo'); e.target.value = ''; }}
              />
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 22px', borderRadius: 50,
                  background: uploadingLogo ? '#F0E4D0' : 'linear-gradient(135deg,#F4A435,#E8735A)',
                  color: uploadingLogo ? '#9A8A7A' : 'white',
                  border: 'none', fontSize: 13, fontWeight: 600,
                  cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                {uploadingLogo ? <><Spinner /> Uploading…</> : '📤 Upload Logo'}
              </button>
              <p style={{ fontSize: 11, color: '#9A8A7A', marginTop: 6 }}>Square image, min 200 × 200px, max 8MB</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>

        {/* Business Details */}
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #F0E4D0', padding: '24px 26px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #F4A435', display: 'inline-block' }}>
            🏢 Business Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Business Name *">
              <input style={inputStyle} value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Silva Matchmakers" />
            </Field>
            <Field label="Contact Person">
              <input style={inputStyle} value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="e.g. Ruwan Silva" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Business Email *">
              <input type="email" style={inputStyle} value={form.businessEmail} onChange={e => set('businessEmail', e.target.value)} placeholder="business@example.com" />
            </Field>
            <Field label="Website">
              <input style={inputStyle} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://www.example.com" />
            </Field>
          </div>

          <Field label="Years of Experience" hint="How many years have you been in this business?">
            <input type="number" style={{ ...inputStyle, width: '50%' }} value={form.yearsOfExperience} onChange={e => set('yearsOfExperience', e.target.value)} placeholder="e.g. 10" min={0} max={60} />
          </Field>

          <Field label="About Your Business" hint="Tell clients what makes your service special.">
            <textarea
              style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Describe your experience, approach, and what clients can expect..."
            />
          </Field>
        </div>

        {/* Services */}
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #F0E4D0', padding: '24px 26px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', marginBottom: 6, paddingBottom: 10, borderBottom: '2px solid #F4A435', display: 'inline-block' }}>
            🤝 Services Offered
          </div>
          <p style={{ fontSize: 12, color: '#9A8A7A', margin: '12px 0 16px', fontFamily: "'Outfit',sans-serif" }}>
            Select all services your business provides. You can offer multiple services.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {PARTNER_SERVICES.map(({ value, label, icon }) => {
              const selected = selectedServices.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleService(value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif", fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                    color: selected ? '#E8735A' : '#5A4A3A',
                    background: selected ? 'rgba(244,164,53,0.08)' : '#FFFBF7',
                    border: selected ? '1.5px solid #F4A435' : '1.5px solid #F0E4D0',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#F4A435'; }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#F0E4D0'; }}
                >
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                  {selected && <span style={{ fontSize: 11, color: '#F4A435', fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
          </div>
          {servicesError && (
            <p style={{ fontSize: 12, color: '#E8735A', marginTop: 8, fontFamily: "'Outfit',sans-serif" }}>⚠ {servicesError}</p>
          )}
        </div>

        {/* Contact */}
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #F0E4D0', padding: '24px 26px', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #F4A435', display: 'inline-block' }}>
            📞 Contact Numbers
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Primary Phone">
              <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+94 77 123 4567" />
            </Field>
            <Field label="WhatsApp Number">
              <input style={inputStyle} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+94 77 123 4567" />
            </Field>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 36px', borderRadius: 50,
              background: saving ? '#F0E4D0' : 'linear-gradient(135deg,#F4A435,#E8735A)',
              color: saving ? '#9A8A7A' : 'white',
              border: 'none', fontSize: 14, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(244,164,53,0.35)',
              fontFamily: "'Outfit',sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving…' : '✅ Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
