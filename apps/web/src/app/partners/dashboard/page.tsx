'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Slug path per service type (undefined = no dedicated dashboard yet)
const SERVICE_SLUG: Record<string, string | undefined> = {
  PHOTOGRAPHER:  'photographer',
  VENUE:         'venue',
  CATERING:      'catering',
  MAKEUP_ARTIST: 'makeup-artist',
  FLORIST:       'florist',
  DJ_MUSIC:      'dj-music',
  CAKE_DESIGNER: 'cake-designer',
  JEWELLERY:     'jewellery',
  MEHENDI:       'mehendi',
};

// Which content types to show in preview per service
const SERVICE_SHOWS: Record<string, { packages: boolean; products: boolean }> = {
  PHOTOGRAPHER:  { packages: true,  products: false },
  VENUE:         { packages: true,  products: false },
  CATERING:      { packages: true,  products: true  },
  MAKEUP_ARTIST: { packages: true,  products: false },
  FLORIST:       { packages: true,  products: true  },
  DJ_MUSIC:      { packages: true,  products: false },
  CAKE_DESIGNER: { packages: true,  products: true  },
  JEWELLERY:     { packages: true,  products: true  },
  MEHENDI:       { packages: false, products: true  },
};

// Services that use their own dedicated API routes instead of the shared partner-content routes
const SERVICE_API_OVERRIDE: Record<string, { packagesPath: string }> = {
  PHOTOGRAPHER: { packagesPath: '/api/photographer/packages' },
};

interface PreviewItem {
  id: number;
  name: string;
  description?: string | null;
  price?: string | number | null;   // packages: price field
  actualPrice?: string | number | null; // products: actualPrice
  discountPercent?: number | null;
  salePrice?: string | number | null;
  imageUrl?: string | null;
  kind: 'package' | 'product';
}

interface MatchmakerStats {
  totalProfiles: number;
  activeProfiles: number;
  successfulMatches: number;
  newContacts: number;
  hiddenProfiles: number;
  deletedProfiles: number;
}

interface PartnerInfo {
  businessName: string;
  contactPerson: string;
  bannerPath: string | null;
  logoImage: string | null;
  types: { type: string }[];
}

// All possible service types with their display config
const SERVICE_CONFIG: Record<string, {
  label: string; icon: string; color: string; bg: string;
}> = {
  MATCHMAKER:    { label: 'Matchmaker',    icon: '💑', color: '#E8735A', bg: '#FFF0EC' },
  PHOTOGRAPHER:  { label: 'Photographer', icon: '📷', color: '#7B8FE8', bg: '#EEF0FD' },
  VENUE:         { label: 'Wedding Venue',icon: '🏛️', color: '#4ABEAA', bg: '#E6FAF7' },
  CATERING:      { label: 'Catering',     icon: '🍽️', color: '#F4A435', bg: '#FFF3E0' },
  MAKEUP_ARTIST: { label: 'Makeup Artist',icon: '💄', color: '#E85AA3', bg: '#FEF0F8' },
  FLORIST:       { label: 'Florist',      icon: '💐', color: '#4ABEAA', bg: '#E6FAF7' },
  DJ_MUSIC:      { label: 'Music / DJ',   icon: '🎵', color: '#7B8FE8', bg: '#EEF0FD' },
  TRANSPORT:     { label: 'Transport',    icon: '🚗', color: '#F4A435', bg: '#FFF3E0' },
  VIDEOGRAPHER:  { label: 'Videography',  icon: '🎬', color: '#7B8FE8', bg: '#EEF0FD' },
  CAKE_DESIGNER: { label: 'Cake Designer',icon: '🎂', color: '#E85AA3', bg: '#FEF0F8' },
  OTHER:         { label: 'Other',        icon: '🎪', color: '#9A8A7A', bg: '#F5F0EB' },
};

function StatCard({ label, value, icon, color, bg, href }: { label: string; value: number; icon: string; color: string; bg: string; href?: string }) {
  const inner = (
    <div style={{
      background: 'white', borderRadius: 18, border: '1px solid #F0E4D0',
      padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      transition: href ? 'transform 0.15s, box-shadow 0.15s' : undefined,
      cursor: href ? 'pointer' : 'default',
    }}
    onMouseEnter={href ? e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${color}22`; } : undefined}
    onMouseLeave={href ? e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; } : undefined}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 2 }}>
        {icon}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#7A6A5A', fontWeight: 500 }}>{label}</div>
      {href && (
        <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>View all →</div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>;
  }
  return inner;
}

function SectionTitle({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        {icon}
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', paddingBottom: 4, borderBottom: `2px solid ${color}` }}>
        {label}
      </div>
    </div>
  );
}

function PriceTag({ item }: { item: PreviewItem }) {
  const base = Number(item.price ?? item.actualPrice ?? 0);
  const disc = item.discountPercent;
  const sale = item.salePrice != null ? Number(item.salePrice) : null;

  if (disc && disc > 0) {
    const final = Math.round(base * (1 - disc / 100));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, color: '#2A1A1A', fontSize: '0.9rem' }}>LKR {final.toLocaleString()}</span>
        <span style={{ fontSize: '0.75rem', color: '#9A8A7A', textDecoration: 'line-through' }}>LKR {base.toLocaleString()}</span>
        <span style={{ fontSize: '0.7rem', background: '#4ABEAA18', color: '#4ABEAA', fontWeight: 700, borderRadius: 20, padding: '1px 7px' }}>{disc}% off</span>
      </div>
    );
  }
  if (sale != null && sale > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 700, color: '#2A1A1A', fontSize: '0.9rem' }}>LKR {sale.toLocaleString()}</span>
        <span style={{ fontSize: '0.75rem', color: '#9A8A7A', textDecoration: 'line-through' }}>LKR {base.toLocaleString()}</span>
      </div>
    );
  }
  return <span style={{ fontWeight: 700, color: '#2A1A1A', fontSize: '0.9rem' }}>LKR {base.toLocaleString()}</span>;
}

function ServicePreviewSection({
  serviceType, color, icon, label, token,
}: { serviceType: string; color: string; icon: string; label: string; token: string | null }) {
  const slug = SERVICE_SLUG[serviceType];
  const shows = SERVICE_SHOWS[serviceType] ?? { packages: true, products: false };
  const dashboardHref = slug ? `/partners/dashboard/${slug}` : null;

  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    const qs = `?serviceType=${encodeURIComponent(serviceType)}`;
    const override = SERVICE_API_OVERRIDE[serviceType];
    const fetches: Promise<PreviewItem[]>[] = [];

    if (shows.packages) {
      // Use dedicated route if available, otherwise shared route with serviceType param
      const packagesUrl = override
        ? `${API}${override.packagesPath}`
        : `${API}/api/partner-content/packages${qs}`;
      fetches.push(
        fetch(packagesUrl, { headers })
          .then(r => r.ok ? r.json() : { packages: [] })
          .then(d => (d.packages ?? []).slice(0, 5).map((p: Record<string, unknown>) => ({
            id: p.id as number, name: p.name as string,
            description: p.description as string | null,
            price: p.price, discountPercent: p.discountPercent as number | null,
            salePrice: p.salePrice, imageUrl: null, kind: 'package' as const,
          })))
          .catch(() => [])
      );
    }
    if (shows.products) {
      fetches.push(
        fetch(`${API}/api/partner-content/products${qs}`, { headers })
          .then(r => r.ok ? r.json() : { products: [] })
          .then(d => (d.products ?? []).slice(0, 5).map((p: Record<string, unknown>) => ({
            id: p.id as number, name: p.name as string,
            description: p.description as string | null,
            actualPrice: p.actualPrice,
            discountPercent: p.discountPercent as number | null,
            salePrice: p.salePrice, imageUrl: p.imageUrl as string | null,
            kind: 'product' as const,
          })))
          .catch(() => [])
      );
    }

    Promise.all(fetches)
      .then(results => setItems(results.flat().slice(0, 10)))
      .finally(() => setLoading(false));
  }, [token, serviceType]);

  // No dedicated dashboard yet — keep "Coming Soon"
  if (!dashboardHref) {
    return (
      <div style={{ background: 'white', borderRadius: 20, border: `1.5px dashed ${color}40`, padding: '36px 28px', textAlign: 'center', marginBottom: 28 }}>
        <SectionTitle icon={icon} label={label} color={color} />
        <div style={{ fontSize: '3rem', marginBottom: 14 }}>🚧</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.1rem', color: '#2A1A1A', marginBottom: 8 }}>
          {label} Dashboard — Coming Soon
        </div>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#9A8A7A', maxWidth: 380, margin: '0 auto' }}>
          We're building powerful tools for your {label.toLowerCase()} business. Stay tuned!
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F0E4D0', padding: '24px 26px', marginBottom: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
        <SectionTitle icon={icon} label={label} color={color} />
        <Link
          href={dashboardHref}
          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 50, background: `${color}14`, border: `1.5px solid ${color}40`, color, fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Manage →
        </Link>
      </div>

      {loading ? (
        <div style={{ color: '#9A8A7A', fontSize: '0.84rem', fontFamily: "'Outfit',sans-serif", padding: '10px 0' }}>Loading…</div>
      ) : items.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📭</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.9rem', color: '#2A1A1A', marginBottom: 4 }}>
            No {shows.packages && shows.products ? 'packages or products' : shows.packages ? 'packages' : 'products'} yet
          </div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#9A8A7A', marginBottom: 16 }}>
            Add your first listing so customers can see what you offer.
          </div>
          <Link
            href={dashboardHref}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 50, background: `linear-gradient(135deg,${color},${color}CC)`, color: '#fff', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.84rem', textDecoration: 'none' }}
          >
            ➕ Add {shows.packages ? 'Package' : 'Product'}
          </Link>
        </div>
      ) : (
        <>
          {/* Item grid — each card links to the service dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
            {items.map(item => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={dashboardHref}
                style={{ textDecoration: 'none', borderRadius: 14, border: `1.5px solid ${color}30`, overflow: 'hidden', background: 'white', display: 'flex', flexDirection: 'column', transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 8px 22px ${color}28`; el.style.borderColor = `${color}70`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = ''; el.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; el.style.borderColor = `${color}30`; }}
              >
                {/* Product image */}
                {item.imageUrl ? (
                  <div style={{ width: '100%', height: 120, overflow: 'hidden', background: '#F5EFE8', position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 64, background: `${color}0E`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                    {icon}
                  </div>
                )}

                <div style={{ padding: '10px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {/* Kind badge */}
                  <span style={{ alignSelf: 'flex-start', fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${color}15`, color, fontFamily: "'Outfit',sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.kind}
                  </span>

                  {/* Name */}
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.88rem', color: '#2A1A1A', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.name}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.74rem', color: '#9A8A7A', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </div>
                  )}

                  {/* Price */}
                  <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                    <PriceTag item={item} />
                  </div>

                  {/* Click hint */}
                  <div style={{ fontSize: '0.7rem', color, fontWeight: 600, fontFamily: "'Outfit',sans-serif", marginTop: 2 }}>
                    Manage →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View all button */}
          <div style={{ textAlign: 'center' }}>
            <Link
              href={dashboardHref}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 26px', borderRadius: 50, border: `1.5px solid ${color}50`, color, fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.84rem', textDecoration: 'none', background: `${color}0A` }}
            >
              View All & Manage →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function MatchmakerSection({ stats }: { stats: MatchmakerStats | null }) {
  const cfg = SERVICE_CONFIG.MATCHMAKER;
  const statCards = [
    { label: 'Total Profiles',     value: stats?.totalProfiles     ?? 0, icon: '👥', color: '#F4A435', bg: '#FFF3E0', href: '/partners/dashboard/matchmaker' },
    { label: 'Active Profiles',    value: stats?.activeProfiles    ?? 0, icon: '✅', color: '#4ABEAA', bg: '#E6FAF7', href: '/partners/dashboard/matchmaker' },
    { label: 'Hidden Profiles',    value: stats?.hiddenProfiles    ?? 0, icon: '🙈', color: '#9B8FE8', bg: '#EEEFFE', href: '/partners/dashboard/matchmaker' },
    { label: 'Deleted Profiles',   value: stats?.deletedProfiles   ?? 0, icon: '🗑️', color: '#E8735A', bg: '#FFF0EC', href: '/partners/dashboard/matchmaker/deleted' },
    { label: 'Successful Matches', value: stats?.successfulMatches ?? 0, icon: '💑', color: '#E85AA3', bg: '#FEF0F8', href: '/partners/dashboard/matchmaker' },
  ];
  const quickActions = [
    { icon: '➕', label: 'Create Profile', href: '/partners/dashboard/matchmaker/profiles/new', color: '#F4A435' },
    { icon: '👥', label: 'View Profiles',  href: '/partners/dashboard/matchmaker',        color: '#E8735A' },
  ];

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F0E4D0', padding: '24px 26px', marginBottom: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <SectionTitle icon={cfg.icon} label="Matchmaker" color={cfg.color} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Quick actions */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9A8A7A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontFamily: "'Outfit',sans-serif" }}>
          Quick Actions
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map(a => (
            <Link
              key={a.href}
              href={a.href}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 50, textDecoration: 'none', background: `${a.color}18`, border: `1.5px solid ${a.color}40`, color: a.color, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MySubscription {
  id: number; status: string; expiresAt: string;
  plan: { value: string; label: string; color: string };
}

function UpgradeBanner({ subscription }: { subscription: MySubscription | null }) {
  const isOnFree = !subscription || subscription.plan.value === 'FREE';
  const isPending = subscription?.status === 'PENDING';

  if (isPending) {
    return (
      <div style={{
        background: 'linear-gradient(135deg,#FFF8E8,#FFF3E0)',
        border: '1.5px solid #F4A43540', borderRadius: 18, padding: '16px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '1.5rem' }}>⏳</div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.92rem', color: '#2A1A1A' }}>
              Payment Verification Pending
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#7A6A5A', marginTop: 2 }}>
              Your bank transfer is being verified. Your plan will be activated within 24 hours.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isOnFree) {
    return (
      <div style={{
        background: 'linear-gradient(135deg,#FFF0F8,#F0F0FF)',
        border: '1.5px solid #E8D8F0', borderRadius: 18, padding: '16px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '1.5rem' }}>🚀</div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.92rem', color: '#2A1A1A' }}>
              You're on the Free Plan
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#7A6A5A', marginTop: 2 }}>
              Upgrade to manage more profiles, access analytics, and get a Verified Matchmaker badge.
            </div>
          </div>
        </div>
        <Link
          href="/partners/dashboard/upgrade"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px',
            borderRadius: 50, background: 'linear-gradient(135deg,#E85AA3,#7B8FE8)',
            color: '#fff', fontFamily: "'Outfit',sans-serif", fontWeight: 700,
            fontSize: '0.88rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          👑 Upgrade Now
        </Link>
      </div>
    );
  }

  // Active paid plan — show minimal status + renew link
  const expiresDate = new Date(subscription!.expiresAt);
  const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft <= 14;

  return (
    <div style={{
      background: isExpiringSoon
        ? 'linear-gradient(135deg,#FFF8E8,#FFF0E0)'
        : `linear-gradient(135deg,${subscription!.plan.color}0A,${subscription!.plan.color}05)`,
      border: `1.5px solid ${isExpiringSoon ? '#F4A43550' : subscription!.plan.color + '30'}`,
      borderRadius: 18, padding: '14px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      marginBottom: 24, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: '1.3rem' }}>{isExpiringSoon ? '⚠️' : '✅'}</div>
        <div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.92rem', color: subscription!.plan.color }}>
            {subscription!.plan.label} Plan Active
          </div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#7A6A5A', marginTop: 2 }}>
            {isExpiringSoon
              ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — renew to keep your benefits`
              : `Active until ${expiresDate.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </div>
        </div>
      </div>
      <Link
        href="/partners/dashboard/upgrade"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px',
          borderRadius: 50, border: `1.5px solid ${subscription!.plan.color}50`,
          color: subscription!.plan.color, fontFamily: "'Outfit',sans-serif",
          fontWeight: 600, fontSize: '0.84rem', textDecoration: 'none',
          background: 'white', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {isExpiringSoon ? '🔄 Renew Plan' : '⬆ Manage Plan'}
      </Link>
    </div>
  );
}

export default function PartnerDashboardHome() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<MatchmakerStats | null>(null);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // Fetch subscription separately (auth via api instance)
    api.get('/api/subscriptions/me').then(res => setSubscription(res.data.data || null)).catch(() => {});
    Promise.allSettled([
      fetch(`${API}/api/matchmaker/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/partners/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([statsRes, partnerRes]) => {
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value;
        setStats({
          totalProfiles:     d.totalProfiles     ?? d.total    ?? 0,
          activeProfiles:    d.activeProfiles    ?? d.active   ?? 0,
          successfulMatches: d.successfulMatches ?? d.matches  ?? 0,
          newContacts:       d.newContacts       ?? d.contacts ?? 0,
          hiddenProfiles:    d.hiddenProfiles    ?? 0,
          deletedProfiles:   d.deletedProfiles   ?? 0,
        });
      }
      if (partnerRes.status === 'fulfilled' && partnerRes.value?.partner) {
        const p = partnerRes.value.partner;
        setPartner({
          businessName:  p.businessName  ?? '',
          contactPerson: p.contactPerson ?? '',
          bannerPath:    p.bannerPath    ?? null,
          logoImage:     p.logoImage     ?? null,
          types:         Array.isArray(p.types) ? p.types : [],
        });
      }
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading…</div>
  );

  const serviceTypes = partner?.types?.map(t => t.type) ?? [];
  const hasService = (s: string) => serviceTypes.includes(s);

  // Services that get a "Coming Soon" section (everything except MATCHMAKER which has real data)
  const comingSoonServices = serviceTypes.filter(s => s !== 'MATCHMAKER');

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif" }}>

      {/* Subscription status / upgrade banner */}
      <UpgradeBanner subscription={subscription} />

      {/* No services configured */}
      {serviceTypes.length === 0 && (
        <div style={{ background: 'white', borderRadius: 20, border: '1.5px dashed #F0E4D0', padding: '48px 28px', textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚙️</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.1rem', color: '#2A1A1A', marginBottom: 8 }}>No services configured</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#9A8A7A', marginBottom: 20 }}>
            Add your services in business settings to unlock your dashboard sections.
          </div>
          <Link href="/partners/dashboard/settings" style={{ padding: '11px 26px', borderRadius: 50, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>
            ✏️ Set Up Services
          </Link>
        </div>
      )}

      {/* Matchmaker section — full analytics */}
      {hasService('MATCHMAKER') && (
        <MatchmakerSection stats={stats} />
      )}

      {/* Service preview sections for all non-matchmaker services */}
      {comingSoonServices.map(service => {
        const cfg = SERVICE_CONFIG[service];
        if (!cfg) return null;
        return (
          <ServicePreviewSection
            key={service}
            serviceType={service}
            color={cfg.color}
            icon={cfg.icon}
            label={cfg.label}
            token={token}
          />
        );
      })}

    </div>
  );
}
