'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const BASE = '/api/partner-content';

export interface ServiceConfig {
  serviceType: string;           // e.g. 'MAKEUP_ARTIST', 'FLORIST', 'CATERING' — scopes all content
  label: string;
  icon: string;
  color: string;
  gradient: string;
  packageHint: string;
  eventLabel: string;
  packageSectionLabel?: string;
  packageSectionIcon?: string;
  priceLabel?: string;
  showCapacity?: boolean;
  showPackages?: boolean;
  showProducts?: boolean;
  showAlbum?: boolean;
  showEvents?: boolean;
  productLabel?: string;
  productHint?: string;
}

type Tab = 'packages' | 'products' | 'album' | 'events';

interface Pkg {
  id: number;
  name: string;
  description: string | null;
  price: string;
  discountPercent: number | null;
  salePrice: string | null;
  capacity: number | null;
}
interface Product {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  actualPrice: string;
  discountPercent: number | null;
  salePrice: string | null;
  isAvailable: boolean;
}
interface Photo { id: number; url: string; caption: string | null; isFeatured: boolean; }
interface EvtPhoto { id: number; url: string; caption: string | null; }
interface Evt { id: number; name: string; description: string | null; eventDate: string; photos: EvtPhoto[]; }

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
const card: React.CSSProperties = {
  background: 'white', borderRadius: 18, border: '1px solid #F0E4D0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
};

function computeFinalPrice(actualPrice: number, discountPercent: number | null, salePrice: number | null): number {
  if (salePrice != null && salePrice > 0) return salePrice;
  if (discountPercent != null && discountPercent > 0) return actualPrice * (1 - discountPercent / 100);
  return actualPrice;
}

function PriceDisplay({ actual, discountPercent, salePrice, color, suffix = '' }: {
  actual: number; discountPercent: number | null; salePrice: number | null; color: string; suffix?: string;
}) {
  const isDiscounted = (salePrice != null && Number(salePrice) > 0) || (discountPercent != null && discountPercent > 0);
  const final = computeFinalPrice(actual, discountPercent, salePrice != null ? Number(salePrice) : null);
  const pct = discountPercent != null && discountPercent > 0 && !(salePrice != null && Number(salePrice) > 0)
    ? discountPercent
    : salePrice != null && Number(salePrice) > 0 && actual > 0
      ? Math.round((1 - Number(salePrice) / actual) * 100)
      : null;

  if (!isDiscounted) {
    return (
      <span style={{ fontWeight: 800, fontSize: 15, color, fontFamily: "'Outfit',sans-serif" }}>
        LKR {actual.toLocaleString()}{suffix}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 800, fontSize: 15, color, fontFamily: "'Outfit',sans-serif" }}>
        LKR {Math.round(final).toLocaleString()}{suffix}
      </span>
      <span style={{ textDecoration: 'line-through', color: '#B0A090', fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
        LKR {actual.toLocaleString()}
      </span>
      {pct != null && pct > 0 && (
        <span style={{ background: '#E8F5E0', color: '#5A9E3A', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50, fontFamily: "'Outfit',sans-serif" }}>
          -{pct}%
        </span>
      )}
    </span>
  );
}

// ── Discount Form Section ──────────────────────────────────────
function DiscountFields({ discountType, setDiscountType, discountPct, setDiscountPct, salePrice, setSalePrice, actualPrice }: {
  discountType: 'none' | 'percent' | 'sale';
  setDiscountType: (v: 'none' | 'percent' | 'sale') => void;
  discountPct: string; setDiscountPct: (v: string) => void;
  salePrice: string; setSalePrice: (v: string) => void;
  actualPrice: string;
}) {
  const finalPrice = discountType === 'percent' && discountPct
    ? Number(actualPrice) * (1 - Number(discountPct) / 100)
    : discountType === 'sale' && salePrice
      ? Number(salePrice)
      : Number(actualPrice);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={lbl}>Discount</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['none', 'percent', 'sale'] as const).map(opt => (
          <button key={opt} type="button" onClick={() => setDiscountType(opt)} style={{
            padding: '7px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: discountType === opt ? 'none' : '1.5px solid #E8D5C0',
            background: discountType === opt ? '#2A1A1A' : 'white',
            color: discountType === opt ? 'white' : '#7A6A5A',
            fontFamily: "'Outfit',sans-serif",
          }}>
            {opt === 'none' ? 'No Discount' : opt === 'percent' ? '% Discount' : 'Sale Price'}
          </button>
        ))}
      </div>
      {discountType === 'percent' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <input style={inp} type="number" min={1} max={99} placeholder="e.g. 15"
              value={discountPct} onChange={e => setDiscountPct(e.target.value)} />
          </div>
          {discountPct && actualPrice && (
            <div style={{ background: '#F5FFF0', border: '1px solid #C0E8A0', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontFamily: "'Outfit',sans-serif", color: '#4A8A2A', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Final: LKR {Math.round(Number(actualPrice) * (1 - Number(discountPct) / 100)).toLocaleString()}
            </div>
          )}
        </div>
      )}
      {discountType === 'sale' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <input style={inp} type="number" min={0} placeholder="e.g. 45000"
              value={salePrice} onChange={e => setSalePrice(e.target.value)} />
          </div>
          {salePrice && actualPrice && Number(actualPrice) > 0 && (
            <div style={{ background: '#F5FFF0', border: '1px solid #C0E8A0', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontFamily: "'Outfit',sans-serif", color: '#4A8A2A', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Save {Math.round((1 - Number(salePrice) / Number(actualPrice)) * 100)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Packages tab ──────────────────────────────────────────────
function PackagesTab({ token, serviceType, cfg }: { token: string; serviceType: string; cfg: ServiceConfig }) {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Pkg | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', capacity: '' });
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'sale'>('none');
  const [discountPct, setDiscountPct]   = useState('');
  const [salePrice,   setSalePrice]     = useState('');

  const auth = { Authorization: `Bearer ${token}` };

  async function load() {
    try {
      const r = await fetch(`${API}${BASE}/packages?serviceType=${encodeURIComponent(serviceType)}`, { headers: auth });
      setPackages((await r.json()).packages ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function resetDiscount() { setDiscountType('none'); setDiscountPct(''); setSalePrice(''); }

  function openNew() {
    setForm({ name: '', description: '', price: '', capacity: '' });
    resetDiscount();
    setShowForm(true); setEditing(null);
  }

  function openEdit(p: Pkg) {
    setForm({ name: p.name, description: p.description ?? '', price: p.price, capacity: p.capacity != null ? String(p.capacity) : '' });
    if (p.salePrice != null && Number(p.salePrice) > 0) {
      setDiscountType('sale'); setSalePrice(String(p.salePrice)); setDiscountPct('');
    } else if (p.discountPercent != null && p.discountPercent > 0) {
      setDiscountType('percent'); setDiscountPct(String(p.discountPercent)); setSalePrice('');
    } else {
      resetDiscount();
    }
    setEditing(p); setShowForm(false);
  }

  async function save() {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    const payload: Record<string, unknown> = {
      ...form,
      serviceType,
      capacity: form.capacity || null,
      discountPercent: discountType === 'percent' && discountPct ? Number(discountPct) : null,
      salePrice:       discountType === 'sale'    && salePrice   ? Number(salePrice)   : null,
    };
    const url = editing ? `${API}${BASE}/packages/${editing.id}` : `${API}${BASE}/packages`;
    const r = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { toast.error((await r.json()).message); return; }
    toast.success(editing ? `${sectionLabel} updated` : `${sectionLabel} created`);
    setShowForm(false); setEditing(null); load();
  }

  async function del(id: number) {
    if (!confirm('Delete this package?')) return;
    await fetch(`${API}${BASE}/packages/${id}`, { method: 'DELETE', headers: auth });
    toast.success('Deleted'); load();
  }

  const sectionLabel = cfg.packageSectionLabel ?? 'Package';
  const priceSuffix  = cfg.priceLabel ? ` / ${cfg.priceLabel}` : '';

  const formEl = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: cfg.showCapacity ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>{sectionLabel} Name *</label>
          <input style={inp} value={form.name} placeholder={cfg.packageHint}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
        <div><label style={lbl}>Price (LKR{priceSuffix}) *</label>
          <input style={inp} type="number" min={0} value={form.price} placeholder="e.g. 250000"
            onChange={e => setForm(p => ({ ...p, price: e.target.value }))} /></div>
        {cfg.showCapacity && (
          <div><label style={lbl}>Guest Capacity</label>
            <input style={inp} type="number" min={1} value={form.capacity} placeholder="e.g. 300"
              onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} /></div>
        )}
      </div>
      <div><label style={lbl}>Description</label>
        <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={3}
          placeholder={cfg.packageSectionLabel === 'Menu' ? 'Menu items, courses, inclusions…' : cfg.showCapacity ? 'Hall features, amenities, inclusions…' : "What's included…"}
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
      <DiscountFields
        discountType={discountType} setDiscountType={setDiscountType}
        discountPct={discountPct} setDiscountPct={setDiscountPct}
        salePrice={salePrice} setSalePrice={setSalePrice}
        actualPrice={form.price}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => { setShowForm(false); setEditing(null); }} style={{
          flex: 1, padding: '10px', borderRadius: 50, border: '1.5px solid #E8D5C0',
          background: 'transparent', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13,
        }}>Cancel</button>
        <button onClick={save} style={{
          flex: 2, padding: '10px', borderRadius: 50, border: 'none',
          background: cfg.gradient, color: 'white', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
        }}>{editing ? 'Save Changes' : `Add ${sectionLabel}`}</button>
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: 0 }}>{sectionLabel}s</h2>
          <p style={{ color: '#9A8A7A', fontSize: 13, margin: '4px 0 0', fontFamily: "'Outfit',sans-serif" }}>
            {cfg.packageSectionLabel === 'Menu'
              ? 'Create your menu offerings — clients can view them on your public page.'
              : 'Create pricing packages for clients to browse on your public page.'}
          </p>
        </div>
        {!showForm && !editing && (
          <button onClick={openNew} style={{
            background: cfg.gradient, color: 'white', border: 'none', borderRadius: 50,
            padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}>+ Add {sectionLabel}</button>
        )}
      </div>

      {showForm && <div style={{ ...card, padding: '24px' }}>{formEl}</div>}

      {packages.length === 0 && !showForm && (
        <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{cfg.packageSectionIcon ?? '📦'}</div>
          <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", margin: 0 }}>No {sectionLabel.toLowerCase()}s yet. Add your first.</p>
        </div>
      )}

      {packages.map(pkg => (
        <div key={pkg.id} style={{ ...card, padding: '20px 24px' }}>
          {editing?.id === pkg.id
            ? formEl
            : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: '#2A1A1A' }}>{pkg.name}</span>
                    <PriceDisplay
                      actual={Number(pkg.price)}
                      discountPercent={pkg.discountPercent}
                      salePrice={pkg.salePrice != null ? Number(pkg.salePrice) : null}
                      color={cfg.color}
                      suffix={priceSuffix}
                    />
                    {pkg.capacity != null && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif", background: '#F5EDE0', padding: '2px 10px', borderRadius: 50 }}>
                        👥 Up to {pkg.capacity.toLocaleString()} guests
                      </span>
                    )}
                  </div>
                  {pkg.description && <p style={{ color: '#7A6A5A', fontSize: 13, margin: 0, fontFamily: "'Outfit',sans-serif", lineHeight: 1.6 }}>{pkg.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => openEdit(pkg)} style={{ padding: '7px 16px', borderRadius: 50, border: '1.5px solid #E8D5C0', background: 'white', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>✏️ Edit</button>
                  <button onClick={() => del(pkg.id)} style={{ padding: '7px 16px', borderRadius: 50, border: '1.5px solid #FFC5C5', background: '#FFF5F5', color: '#E87070', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>🗑 Delete</button>
                </div>
              </div>
            )
          }
        </div>
      ))}
    </div>
  );
}

// ── Products tab ──────────────────────────────────────────────
function ProductsTab({ token, serviceType, cfg }: { token: string; serviceType: string; cfg: ServiceConfig }) {
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState<Product | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({ name: '', description: '', actualPrice: '' });
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'sale'>('none');
  const [discountPct, setDiscountPct]   = useState('');
  const [salePrice,   setSalePrice]     = useState('');
  const [previewImg,  setPreviewImg]    = useState<string | null>(null);
  const [imageFile,   setImageFile]     = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const auth = { Authorization: `Bearer ${token}` };
  const productLabel = cfg.productLabel ?? 'Product';
  const productHint  = cfg.productHint  ?? 'e.g. Bouquet, Garland…';

  async function load() {
    try {
      const r = await fetch(`${API}${BASE}/products?serviceType=${encodeURIComponent(serviceType)}`, { headers: auth });
      setProducts((await r.json()).products ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ name: '', description: '', actualPrice: '' });
    setDiscountType('none'); setDiscountPct(''); setSalePrice('');
    setPreviewImg(null); setImageFile(null);
  }

  function openNew() { resetForm(); setEditing(null); setShowForm(true); }

  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description ?? '', actualPrice: p.actualPrice });
    if (p.salePrice != null && Number(p.salePrice) > 0) {
      setDiscountType('sale'); setSalePrice(String(p.salePrice)); setDiscountPct('');
    } else if (p.discountPercent != null && p.discountPercent > 0) {
      setDiscountType('percent'); setDiscountPct(String(p.discountPercent)); setSalePrice('');
    } else {
      setDiscountType('none'); setDiscountPct(''); setSalePrice('');
    }
    setPreviewImg(p.imageUrl); setImageFile(null);
    setEditing(p); setShowForm(false);
  }

  async function save() {
    if (!form.name || !form.actualPrice) { toast.error('Name and price are required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('actualPrice', form.actualPrice);
      fd.append('serviceType', serviceType);
      fd.append('discountPercent', discountType === 'percent' && discountPct ? discountPct : '');
      fd.append('salePrice', discountType === 'sale' && salePrice ? salePrice : '');
      if (imageFile) fd.append('image', imageFile);

      const url = editing ? `${API}${BASE}/products/${editing.id}` : `${API}${BASE}/products`;
      const r = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: auth, body: fd });
      if (!r.ok) { toast.error((await r.json()).message); return; }
      toast.success(editing ? `${productLabel} updated` : `${productLabel} added`);
      setShowForm(false); setEditing(null); resetForm(); load();
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm(`Delete this ${productLabel.toLowerCase()}?`)) return;
    await fetch(`${API}${BASE}/products/${id}`, { method: 'DELETE', headers: auth });
    toast.success('Deleted'); load();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPreviewImg(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const formEl = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Image upload */}
      <div>
        <label style={lbl}>{productLabel} Image</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed #E8D5C0', borderRadius: 14, cursor: 'pointer',
            overflow: 'hidden', position: 'relative',
            height: previewImg ? 'auto' : 120,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#FFFBF7', transition: 'border-color 0.2s',
          }}
        >
          {previewImg
            ? <img src={previewImg} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
            : (
              <div style={{ textAlign: 'center', color: '#C0B0A0', fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: 12 }}>Click to upload image</div>
              </div>
            )
          }
          {previewImg && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.45)', color: 'white', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontFamily: "'Outfit',sans-serif", opacity: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
              >Change image</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>{productLabel} Name *</label>
          <input style={inp} value={form.name} placeholder={productHint}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
        <div><label style={lbl}>Price (LKR) *</label>
          <input style={inp} type="number" min={0} value={form.actualPrice} placeholder="e.g. 3500"
            onChange={e => setForm(p => ({ ...p, actualPrice: e.target.value }))} /></div>
      </div>

      <div><label style={lbl}>Description</label>
        <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={2}
          placeholder="Describe the item, size, colour options…"
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>

      <DiscountFields
        discountType={discountType} setDiscountType={setDiscountType}
        discountPct={discountPct} setDiscountPct={setDiscountPct}
        salePrice={salePrice} setSalePrice={setSalePrice}
        actualPrice={form.actualPrice}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} style={{
          flex: 1, padding: '10px', borderRadius: 50, border: '1.5px solid #E8D5C0',
          background: 'transparent', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13,
        }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{
          flex: 2, padding: '10px', borderRadius: 50, border: 'none',
          background: cfg.gradient, color: 'white', fontWeight: 700, fontSize: 13,
          cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif",
          opacity: saving ? 0.7 : 1,
        }}>{saving ? 'Saving…' : editing ? 'Save Changes' : `Add ${productLabel}`}</button>
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: 0 }}>{productLabel}s</h2>
          <p style={{ color: '#9A8A7A', fontSize: 13, margin: '4px 0 0', fontFamily: "'Outfit',sans-serif" }}>
            List your items with images and pricing — visible on your public page.
          </p>
        </div>
        {!showForm && !editing && (
          <button onClick={openNew} style={{
            background: cfg.gradient, color: 'white', border: 'none', borderRadius: 50,
            padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}>+ Add {productLabel}</button>
        )}
      </div>

      {showForm && <div style={{ ...card, padding: '24px' }}>{formEl}</div>}

      {products.length === 0 && !showForm && (
        <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", margin: 0 }}>
            No {productLabel.toLowerCase()}s yet. Add your first item.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {products.map(prod => (
          <div key={prod.id} style={{ ...card, overflow: 'hidden' }}>
            {editing?.id === prod.id
              ? <div style={{ padding: '20px' }}>{formEl}</div>
              : (
                <>
                  {/* Product image */}
                  <div style={{ paddingBottom: '70%', position: 'relative', background: '#F5EDE0' }}>
                    {prod.imageUrl
                      ? <img src={prod.imageUrl} alt={prod.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0B0A0', fontSize: 32 }}>
                          🏷️
                        </div>
                      )
                    }
                    {!prod.isAvailable && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 50, fontFamily: "'Outfit',sans-serif" }}>
                        Unavailable
                      </div>
                    )}
                  </div>
                  {/* Product info */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: '#2A1A1A', marginBottom: 6 }}>{prod.name}</div>
                    <div style={{ marginBottom: 8 }}>
                      <PriceDisplay
                        actual={Number(prod.actualPrice)}
                        discountPercent={prod.discountPercent}
                        salePrice={prod.salePrice != null ? Number(prod.salePrice) : null}
                        color={cfg.color}
                      />
                    </div>
                    {prod.description && (
                      <p style={{ color: '#9A8A7A', fontSize: 12, margin: '0 0 10px', fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }}>
                        {prod.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(prod)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1.5px solid #E8D5C0', background: 'white', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>✏️ Edit</button>
                      <button onClick={() => del(prod.id)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #FFC5C5', background: '#FFF5F5', color: '#E87070', cursor: 'pointer', fontSize: 12 }}>🗑</button>
                    </div>
                  </div>
                </>
              )
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Album tab ─────────────────────────────────────────────────
function AlbumTab({ token, serviceType, cfg }: { token: string; serviceType: string; cfg: ServiceConfig }) {
  const [photos,       setPhotos]       = useState<Photo[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [uploadCount,  setUploadCount]  = useState({ done: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const auth = { Authorization: `Bearer ${token}` };
  const featured = photos.filter(p => p.isFeatured);

  async function load() {
    try {
      const r = await fetch(`${API}${BASE}/photos?serviceType=${encodeURIComponent(serviceType)}`, { headers: auth });
      setPhotos((await r.json()).photos ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function upload(file: File): Promise<boolean> {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('serviceType', serviceType);
    try {
      const r = await fetch(`${API}${BASE}/photos`, { method: 'POST', headers: auth, body: fd });
      if (!r.ok) { toast.error((await r.json()).message ?? 'Upload failed'); return false; }
      return true;
    } catch { toast.error('Upload failed'); return false; }
  }

  async function uploadFiles(files: FileList) {
    const list = Array.from(files);
    setUploading(true);
    setUploadCount({ done: 0, total: list.length });
    let done = 0;
    for (const file of list) {
      await upload(file);
      done++;
      setUploadCount({ done, total: list.length });
    }
    setUploading(false);
    toast.success(`${done} photo${done !== 1 ? 's' : ''} uploaded`);
    load();
  }

  async function toggleFeat(photo: Photo) {
    const r = await fetch(`${API}${BASE}/photos/${photo.id}/featured`, { method: 'PUT', headers: auth });
    const d = await r.json();
    if (!r.ok) { toast.error(d.message); return; }
    toast.success(photo.isFeatured ? 'Removed from featured' : 'Added to featured'); load();
  }

  async function del(id: number) {
    if (!confirm('Delete this photo?')) return;
    await fetch(`${API}${BASE}/photos/${id}`, { method: 'DELETE', headers: auth });
    toast.success('Photo deleted'); load();
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: 0 }}>Album</h2>
          <p style={{ color: '#9A8A7A', fontSize: 13, margin: '4px 0 0', fontFamily: "'Outfit',sans-serif" }}>
            Upload your work. Mark up to 10 as featured — they show on your public page.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: `${cfg.color}12`, color: cfg.color, padding: '5px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            ⭐ {featured.length}/10 featured
          </span>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
            background: cfg.gradient, color: 'white', border: 'none', borderRadius: 50,
            padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: uploading ? 'not-allowed' : 'pointer',
            fontFamily: "'Outfit',sans-serif", opacity: uploading ? 0.7 : 1,
          }}>
            {uploading ? `Uploading ${uploadCount.done}/${uploadCount.total}…` : '+ Upload Photos'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ''; }} />
        </div>
      </div>

      {photos.length === 0 && (
        <div style={{ ...card, padding: '64px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🖼️</div>
          <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", margin: 0 }}>No photos yet. Upload your first.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
        {photos.map(ph => (
          <div key={ph.id} style={{
            borderRadius: 14, overflow: 'hidden',
            border: ph.isFeatured ? `2px solid ${cfg.color}` : '1px solid #F0E4D0',
            boxShadow: ph.isFeatured ? `0 4px 16px ${cfg.color}30` : 'none',
          }}>
            <div style={{ position: 'relative', paddingBottom: '75%', background: '#F5EDE0' }}>
              <img src={ph.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {ph.isFeatured && (
                <div style={{ position: 'absolute', top: 8, left: 8, background: cfg.color, color: 'white', borderRadius: 50, padding: '3px 10px', fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>⭐ Featured</div>
              )}
            </div>
            <div style={{ padding: '10px 12px', background: 'white', display: 'flex', gap: 6 }}>
              <button onClick={() => toggleFeat(ph)} style={{
                flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                border: ph.isFeatured ? `1.5px solid ${cfg.color}` : '1.5px solid #E8D5C0',
                background: ph.isFeatured ? `${cfg.color}12` : 'white',
                color: ph.isFeatured ? cfg.color : '#9A8A7A',
                cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
              }}>{ph.isFeatured ? '★ Featured' : '☆ Feature'}</button>
              <button onClick={() => del(ph.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #FFC5C5', background: '#FFF5F5', color: '#E87070', cursor: 'pointer', fontSize: 12 }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Events tab ────────────────────────────────────────────────
function EventsTab({ token, serviceType, cfg }: { token: string; serviceType: string; cfg: ServiceConfig }) {
  const [events,       setEvents]       = useState<Evt[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState({ name: '', description: '', eventDate: '' });
  const [saving,       setSaving]       = useState(false);
  const [editingEvt,   setEditingEvt]   = useState<Evt | null>(null);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const auth = { Authorization: `Bearer ${token}` };

  async function load() {
    try {
      const r = await fetch(`${API}${BASE}/events?serviceType=${encodeURIComponent(serviceType)}`, { headers: auth });
      setEvents((await r.json()).events ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createEvt() {
    if (!form.name || !form.eventDate) { toast.error('Name and date are required'); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}${BASE}/events`, {
        method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, serviceType }),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success('Event created'); setForm({ name: '', description: '', eventDate: '' }); setShowForm(false); load();
    } catch (e: any) { toast.error(e.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  async function saveEdit() {
    if (!editingEvt) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}${BASE}/events/${editingEvt.id}`, {
        method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingEvt.name, description: editingEvt.description, eventDate: editingEvt.eventDate }),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success('Event updated'); setEditingEvt(null); load();
    } catch (e: any) { toast.error(e.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  async function delEvt(id: number) {
    if (!confirm('Delete this event and all its photos?')) return;
    await fetch(`${API}${BASE}/events/${id}`, { method: 'DELETE', headers: auth });
    toast.success('Event deleted'); load();
  }

  async function uploadEvtPhoto(eventId: number, file: File) {
    setUploadingFor(eventId);
    const fd = new FormData(); fd.append('image', file);
    try {
      const r = await fetch(`${API}${BASE}/events/${eventId}/photos`, { method: 'POST', headers: auth, body: fd });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success('Photo uploaded'); load();
    } catch (e: any) { toast.error(e.message ?? 'Upload failed'); }
    finally { setUploadingFor(null); }
  }

  async function delEvtPhoto(eventId: number, photoId: number) {
    if (!confirm('Delete this photo?')) return;
    await fetch(`${API}${BASE}/events/${eventId}/photos/${photoId}`, { method: 'DELETE', headers: auth });
    toast.success('Photo deleted'); load();
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: 0 }}>Events</h2>
          <p style={{ color: '#9A8A7A', fontSize: 13, margin: '4px 0 0', fontFamily: "'Outfit',sans-serif" }}>
            Showcase the {cfg.eventLabel.toLowerCase()}s you've worked at.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            background: cfg.gradient, color: 'white', border: 'none', borderRadius: 50,
            padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
          }}>+ Add {cfg.eventLabel}</button>
        )}
      </div>

      {showForm && (
        <div style={{ ...card, padding: '24px' }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#2A1A1A', margin: '0 0 16px' }}>New {cfg.eventLabel}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>{cfg.eventLabel} Name *</label>
                <input style={inp} placeholder="e.g. Priya & Kushan's Wedding"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label style={lbl}>Date *</label>
                <input style={inp} type="date" value={form.eventDate}
                  onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} /></div>
            </div>
            <div><label style={lbl}>Description</label>
              <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={2}
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowForm(false); setForm({ name: '', description: '', eventDate: '' }); }} style={{ flex: 1, padding: '10px', borderRadius: 50, border: '1.5px solid #E8D5C0', background: 'transparent', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>Cancel</button>
              <button onClick={createEvt} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 50, border: 'none', background: cfg.gradient, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Creating…' : `Create ${cfg.eventLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {events.length === 0 && !showForm && (
        <div style={{ ...card, padding: '64px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🎊</div>
          <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", margin: 0 }}>No events yet. Add your first.</p>
        </div>
      )}

      {events.map(ev => (
        <div key={ev.id} style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F5EDE0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ flex: 1 }}>
              {editingEvt?.id === ev.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input style={inp} value={editingEvt.name} onChange={e => setEditingEvt(p => p ? { ...p, name: e.target.value } : p)} />
                    <input style={inp} type="date" value={editingEvt.eventDate.split('T')[0]} onChange={e => setEditingEvt(p => p ? { ...p, eventDate: e.target.value } : p)} />
                  </div>
                  <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={2} value={editingEvt.description ?? ''} onChange={e => setEditingEvt(p => p ? { ...p, description: e.target.value } : p)} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditingEvt(null)} style={{ padding: '7px 16px', borderRadius: 50, border: '1.5px solid #E8D5C0', background: 'white', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12 }}>Cancel</button>
                    <button onClick={saveEdit} disabled={saving} style={{ padding: '7px 16px', borderRadius: 50, border: 'none', background: cfg.gradient, color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: '#2A1A1A', marginBottom: 3 }}>{ev.name}</div>
                  <div style={{ fontSize: 12, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", marginBottom: ev.description ? 5 : 0 }}>
                    📅 {new Date(ev.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {ev.description && <p style={{ fontSize: 13, color: '#7A6A5A', margin: 0, fontFamily: "'Outfit',sans-serif" }}>{ev.description}</p>}
                </>
              )}
            </div>
            {!editingEvt && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setEditingEvt(ev)} style={{ padding: '6px 14px', borderRadius: 50, border: '1.5px solid #E8D5C0', background: 'white', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12 }}>✏️</button>
                <button onClick={() => delEvt(ev.id)} style={{ padding: '6px 14px', borderRadius: 50, border: '1.5px solid #FFC5C5', background: '#FFF5F5', color: '#E87070', cursor: 'pointer', fontSize: 12 }}>🗑</button>
              </div>
            )}
          </div>

          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>{ev.photos.length} photo{ev.photos.length !== 1 ? 's' : ''}</span>
              <button onClick={() => fileRefs.current[ev.id]?.click()} disabled={uploadingFor === ev.id} style={{ padding: '6px 16px', borderRadius: 50, border: `1.5px solid ${cfg.color}`, background: 'white', color: cfg.color, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700, opacity: uploadingFor === ev.id ? 0.6 : 1 }}>
                {uploadingFor === ev.id ? 'Uploading…' : '+ Add Photos'}
              </button>
              <input ref={el => { fileRefs.current[ev.id] = el; }} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={async e => { for (const f of Array.from(e.target.files ?? [])) await uploadEvtPhoto(ev.id, f); e.target.value = ''; }} />
            </div>
            {ev.photos.length === 0
              ? <div style={{ border: '2px dashed #F0E4D0', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#C0B0A0', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>No photos yet</div>
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
                  {ev.photos.map(ph => (
                    <div key={ph.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ paddingBottom: '75%', position: 'relative', background: '#F5EDE0' }}>
                        <img src={ph.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <button onClick={() => delEvtPhoto(ev.id, ph.id)} style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%', background: 'rgba(232,112,112,0.9)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────
export default function ServiceContentDashboard({ cfg }: { cfg: ServiceConfig }) {
  const { token } = useAuthStore();

  const showPackages = cfg.showPackages !== false;
  const showProducts = cfg.showProducts === true;
  const showAlbum    = cfg.showAlbum    !== false;
  const showEvents   = cfg.showEvents   !== false;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    ...(showPackages ? [{ key: 'packages' as Tab, label: `${cfg.packageSectionLabel ?? 'Package'}s`, icon: cfg.packageSectionIcon ?? '📦' }] : []),
    ...(showProducts ? [{ key: 'products' as Tab, label: `${cfg.productLabel ?? 'Product'}s`, icon: '🏷️' }] : []),
    ...(showAlbum    ? [{ key: 'album'    as Tab, label: 'Album',  icon: '🖼️' }] : []),
    ...(showEvents   ? [{ key: 'events'   as Tab, label: 'Events', icon: '🎊' }] : []),
  ];

  const [tab, setTab] = useState<Tab>(tabs[0]?.key ?? 'packages');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {cfg.icon}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 22, color: '#2A1A1A', margin: 0 }}>
            {cfg.label} Dashboard
          </h1>
        </div>
        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: '#9A8A7A', margin: 0 }}>
          Manage your content — all shown on your public profile page.
        </p>
      </div>

      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F5EDE0', borderRadius: 14, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#2A1A1A' : '#9A8A7A',
              fontWeight: tab === t.key ? 700 : 500, fontSize: 13,
              cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
              boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      )}

      {token && tab === 'packages' && showPackages && <PackagesTab token={token} serviceType={cfg.serviceType} cfg={cfg} />}
      {token && tab === 'products' && showProducts && <ProductsTab token={token} serviceType={cfg.serviceType} cfg={cfg} />}
      {token && tab === 'album'    && showAlbum    && <AlbumTab    token={token} serviceType={cfg.serviceType} cfg={cfg} />}
      {token && tab === 'events'   && showEvents   && <EventsTab   token={token} serviceType={cfg.serviceType} cfg={cfg} />}
    </div>
  );
}
