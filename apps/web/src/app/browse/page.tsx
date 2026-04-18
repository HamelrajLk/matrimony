'use client';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ─── Types ─── */
interface LookupItem { id: number; name: string; }
interface LookupOption { id: number; value: string; label: string; }
interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  aboutMe?: string;
  countryLiving?: { name: string };
  religion?: { name: string };
  highestEducation?: { name: string };
  occupation?: { name: string };
  motherTongue?: { name: string };
  photos: { imageUrl: string; isPrimary: boolean }[];
  isVerified: boolean;
}
interface OccupationGroup { id: number; name: string; occupations: LookupItem[]; }
interface Filters {
  gender: string;
  minAge: string;
  maxAge: string;
  religionId: string;
  countryId: string;
  nativeCountryId: string;
  citizenshipId: string;
  educationId: string;
  occupationId: string;
  employmentStatus: string;
  maritalStatus: string;
  bodyType: string;
  physicalStatus: string;
  smokingHabit: string;
  drinkingHabit: string;
  eatingHabits: string[];
  minHeight: string;
  maxHeight: string;
  hasPhoto: boolean;
  motherTongueId: string;
}

const LOOKING_FOR = [
  { value: 'FEMALE', label: 'Bride (Female)' },
  { value: 'MALE',   label: 'Groom (Male)' },
  { value: '',       label: 'Anyone' },
];

const AGE_OPTIONS = Array.from({ length: 43 }, (_, i) => i + 18);

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

const defaultFilters = (): Filters => ({
  gender: '', minAge: '18', maxAge: '60',
  religionId: '', countryId: '', nativeCountryId: '', citizenshipId: '',
  educationId: '', occupationId: '', employmentStatus: '',
  maritalStatus: '', bodyType: '', physicalStatus: '',
  smokingHabit: '', drinkingHabit: '', eatingHabits: [],
  minHeight: '', maxHeight: '',
  hasPhoto: false, motherTongueId: '',
});

/* ─── Petal Rain (whole-page fixed) ─── */
const PETALS = [
  { l: '3%',  d: 0,   dur: 9  }, { l: '10%', d: 2,   dur: 7  },
  { l: '18%', d: 1,   dur: 11 }, { l: '26%', d: 3.5, dur: 8  },
  { l: '35%', d: 0.5, dur: 10 }, { l: '44%', d: 2.8, dur: 7.5 },
  { l: '53%', d: 1.5, dur: 9.5 }, { l: '62%', d: 4,  dur: 8  },
  { l: '71%', d: 0.8, dur: 11 }, { l: '80%', d: 2.2, dur: 7  },
  { l: '89%', d: 3,   dur: 9  }, { l: '96%', d: 1.2, dur: 8.5 },
];
const EMOJIS = ['🌸', '🌺', '✿', '🌼'];

function PagePetals() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {PETALS.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.l, top: '-40px',
          fontSize: i % 3 === 0 ? '1.4rem' : '0.95rem',
          animation: `petalFall ${p.dur}s linear ${p.d}s infinite`,
          opacity: 0.5,
        }}>
          {EMOJIS[i % 4]}
        </div>
      ))}
    </div>
  );
}

/* ─── Skeleton Card ─── */
function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      <div style={{ height: 220, background: 'linear-gradient(135deg,#fdf0e6,#fff5ee)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ height: 14, borderRadius: 8, background: '#F0E4D0', marginBottom: 8, width: '70%' }} />
        <div style={{ height: 11, borderRadius: 6, background: '#F5EDE0', width: '50%' }} />
      </div>
    </div>
  );
}

/* ─── Profile Card ─── */
function ProfileCard({ p }: { p: Profile }) {
  const photo = p.photos?.find(x => x.isPrimary) ?? p.photos?.[0];
  const age   = p.dateOfBirth ? calcAge(p.dateOfBirth) : null;

  return (
    <Link href={`/browse/${p.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'white', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          border: '1px solid #F0E4D0',
          transition: 'transform .2s, box-shadow .2s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(244,164,53,0.18)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = '';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
        }}
      >
        {/* Photo */}
        <div style={{ position: 'relative', paddingBottom: '115%', background: 'linear-gradient(135deg,#fdf0e6,#ffe4d0)' }}>
          {photo ? (
            <img
              src={photo.imageUrl}
              alt={p.firstName}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 56, color: '#d4a574',
            }}>
              {p.gender === 'MALE' ? '👨' : '👩'}
            </div>
          )}
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '50%',
            background: 'linear-gradient(transparent,rgba(42,26,26,0.55))',
          }} />
          {/* Name overlay */}
          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
            <div style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700, fontSize: 15, color: 'white',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}>
              {p.firstName} {p.lastName?.[0]}.
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: "'Outfit',sans-serif", marginTop: 1 }}>
              {age ? `${age} yrs` : ''}
              {p.countryLiving ? ` · ${p.countryLiving.name}` : ''}
            </div>
          </div>
          {p.isVerified && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: '#4ABEAA', color: 'white',
              borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700,
              fontFamily: "'Outfit',sans-serif",
            }}>✓ Verified</div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {[p.religion?.name, p.highestEducation?.name, p.occupation?.name]
              .filter(Boolean).slice(0, 3)
              .map((tag, i) => (
                <span key={i} style={{
                  background: '#FFF3E0', color: '#E8735A',
                  borderRadius: 50, padding: '3px 10px',
                  fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
                }}>{tag}</span>
              ))}
          </div>
          {p.aboutMe && (
            <p style={{
              fontSize: 12, color: '#7A6A5A', lineHeight: 1.55,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              fontFamily: "'Outfit',sans-serif", margin: 0,
            }}>{p.aboutMe}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Pagination ─── */
function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums: (number | '...')[] = [];
  if (pages <= 7) { for (let i = 1; i <= pages; i++) nums.push(i); }
  else {
    nums.push(1);
    if (page > 3) nums.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i);
    if (page < pages - 2) nums.push('...');
    nums.push(pages);
  }
  const btn: React.CSSProperties = {
    padding: '8px 16px', borderRadius: 12, border: 'none',
    background: 'white', color: '#5A4A3A', cursor: 'pointer',
    fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'all .2s',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40 }}>
      <button style={{ ...btn, opacity: page === 1 ? 0.4 : 1 }} disabled={page === 1} onClick={() => onPage(page - 1)}>← Prev</button>
      {nums.map((n, i) => n === '...' ? (
        <span key={`e${i}`} style={{ color: '#9A8A7A', fontSize: 13 }}>…</span>
      ) : (
        <button key={n} onClick={() => onPage(n as number)} style={{
          ...btn, width: 38, padding: 0,
          background: n === page ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'white',
          color: n === page ? 'white' : '#5A4A3A',
          fontWeight: n === page ? 700 : 500,
        }}>{n}</button>
      ))}
      <button style={{ ...btn, opacity: page === pages ? 0.4 : 1 }} disabled={page === pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

/* ─── Inline select style ─── */
const selStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1.5px solid #E8D5C0', fontFamily: "'Outfit',sans-serif",
  fontSize: 13, color: '#2A1A1A', background: 'white', outline: 'none',
  appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239A8A7A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  paddingRight: 30, cursor: 'pointer',
};

const labelSt: React.CSSProperties = {
  display: 'block', fontFamily: "'Outfit',sans-serif",
  fontSize: '0.66rem', fontWeight: 700, color: '#9A8A7A',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
function BrowsePublicPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [filters,  setFilters]  = useState<Filters>(defaultFilters());
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [lookup,   setLookup]   = useState<{
    religions: LookupItem[]; countries: LookupItem[];
    educations: LookupItem[]; motherTongues: LookupItem[];
    maritalStatuses: LookupOption[];
    occupationGroups: OccupationGroup[];
    bodyTypes: LookupOption[]; physicalStatuses: LookupOption[];
    smokingHabits: LookupOption[]; drinkingHabits: LookupOption[];
    eatingHabits: LookupOption[]; employmentStatuses: LookupOption[];
  }>({ religions: [], countries: [], educations: [], motherTongues: [], maritalStatuses: [],
       occupationGroups: [], bodyTypes: [], physicalStatuses: [],
       smokingHabits: [], drinkingHabits: [], eatingHabits: [], employmentStatuses: [] });

  const initDone = useRef(false);

  /* Load lookup data */
  useEffect(() => {
    fetch(`${API}/api/profiles/lookup`)
      .then(r => r.ok ? r.json() : {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => setLookup({
        religions:         d.religions          ?? [],
        countries:         d.countries          ?? [],
        educations:        d.educations         ?? [],
        motherTongues:     d.motherTongues       ?? [],
        maritalStatuses:   d.maritalStatuses     ?? [],
        occupationGroups:  d.occupationGroups    ?? [],
        bodyTypes:         d.bodyTypes           ?? [],
        physicalStatuses:  d.physicalStatuses    ?? [],
        smokingHabits:     d.smokingHabits       ?? [],
        drinkingHabits:    d.drinkingHabits      ?? [],
        eatingHabits:      d.eatingHabits        ?? [],
        employmentStatuses: d.employmentStatuses ?? [],
      }))
      .catch(() => {});
  }, []);

  const doSearch = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(p) });
      if (f.gender)            q.set('gender',            f.gender);
      if (f.minAge)            q.set('minAge',            f.minAge);
      if (f.maxAge)            q.set('maxAge',            f.maxAge);
      if (f.religionId)        q.set('religionId',        f.religionId);
      if (f.countryId)         q.set('countryLivingId',   f.countryId);
      if (f.nativeCountryId)   q.set('nativeCountryId',   f.nativeCountryId);
      if (f.citizenshipId)     q.set('citizenshipId',     f.citizenshipId);
      if (f.educationId)       q.set('highestEducationId',f.educationId);
      if (f.occupationId)      q.set('occupationId',      f.occupationId);
      if (f.employmentStatus)  q.set('employmentStatus',  f.employmentStatus);
      if (f.maritalStatus)     q.set('maritalStatus',     f.maritalStatus);
      if (f.bodyType)          q.set('bodyType',          f.bodyType);
      if (f.physicalStatus)    q.set('physicalStatus',    f.physicalStatus);
      if (f.smokingHabit)      q.set('smokingHabit',      f.smokingHabit);
      if (f.drinkingHabit)     q.set('drinkingHabit',     f.drinkingHabit);
      if (f.eatingHabits.length) q.set('eatingHabits',   f.eatingHabits.join(','));
      if (f.minHeight)         q.set('minHeight',         f.minHeight);
      if (f.maxHeight)         q.set('maxHeight',         f.maxHeight);
      if (f.hasPhoto)          q.set('hasPhoto',          'true');
      if (f.motherTongueId)    q.set('motherTongueId',    f.motherTongueId);
      const res  = await fetch(`${API}/api/profiles?${q}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      setTotal(data.total  ?? 0);
      setPages(data.pages  ?? 1);
      setPage(p);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  /* Init from URL params */
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    const f: Filters = {
      ...defaultFilters(),
      gender:        searchParams.get('gender')        ?? '',
      minAge:        searchParams.get('minAge')        ?? '18',
      maxAge:        searchParams.get('maxAge')        ?? '60',
      motherTongueId: searchParams.get('motherTongueId') ?? '',
      religionId:    searchParams.get('religionId')    ?? '',
      countryId:     searchParams.get('countryLivingId') ?? searchParams.get('countryId') ?? '',
      educationId:   searchParams.get('highestEducationId') ?? '',
      maritalStatus: searchParams.get('maritalStatus') ?? '',
    };
    setFilters(f);
    doSearch(f, 1);
  }, [searchParams, doSearch]);

  function handleSearch(p = 1) { doSearch(filters, p); }

  function clearAll() {
    const f = defaultFilters();
    setFilters(f);
    doSearch(f, 1);
  }

  const genderLabel = filters.gender === 'FEMALE' ? 'Brides' : filters.gender === 'MALE' ? 'Grooms' : 'Profiles';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif", position: 'relative' }}>
      <PagePetals />
      <Navbar />

      {/* ── Hero strip ── */}
      <div style={{
        paddingTop: 72,
        background: 'linear-gradient(135deg,#FF7E5F 0%,#FEB47B 40%,#FF6EB4 75%,#A78BFA 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradShift 10s ease infinite',
        padding: '100px 5% 52px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,3rem)',
          color: 'white', margin: '0 0 12px',
          textShadow: '0 2px 16px rgba(0,0,0,0.15)',
        }}>
          Browse {genderLabel}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', fontFamily: "'Outfit',sans-serif", margin: 0 }}>
          {total > 0 ? `${total.toLocaleString()} profiles found` : 'Find your perfect match'}
        </p>
        {/* Breadcrumb */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13 }}>Home</Link>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>›</span>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Browse Profiles</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '40px 5% 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* ════════ LEFT SIDEBAR ════════ */}
          <div style={{
            width: 280, flexShrink: 0,
            position: 'sticky', top: 88,
            maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
            background: 'white', borderRadius: 24,
            boxShadow: '0 8px 32px rgba(244,164,53,0.08)',
            border: '1px solid #F0E4D0',
            padding: '28px 22px',
          }}>
            {/* Sidebar header */}
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17, color: '#2A1A1A', margin: 0 }}>
                Filter Search
              </h2>
              <div style={{ width: 36, height: 3, background: 'linear-gradient(90deg,#F4A435,#E8735A)', borderRadius: 4, marginTop: 8 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Looking for */}
              <div>
                <label style={labelSt}>I&apos;m Looking For</label>
                <select style={selStyle} value={filters.gender} onChange={e => setFilters(p => ({ ...p, gender: e.target.value }))}>
                  {LOOKING_FOR.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Age range */}
              <div>
                <label style={labelSt}>Age Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select style={{ ...selStyle, flex: 1 }} value={filters.minAge} onChange={e => setFilters(p => ({ ...p, minAge: e.target.value }))}>
                    {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <span style={{ color: '#9A8A7A', fontSize: 13, flexShrink: 0 }}>–</span>
                  <select style={{ ...selStyle, flex: 1 }} value={filters.maxAge} onChange={e => setFilters(p => ({ ...p, maxAge: e.target.value }))}>
                    {AGE_OPTIONS.filter(a => a >= Number(filters.minAge)).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Religion */}
              <div>
                <label style={labelSt}>Religion</label>
                <select style={selStyle} value={filters.religionId} onChange={e => setFilters(p => ({ ...p, religionId: e.target.value }))}>
                  <option value="">Any religion</option>
                  {lookup.religions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {/* Country */}
              <div>
                <label style={labelSt}>Country Living</label>
                <select style={selStyle} value={filters.countryId} onChange={e => setFilters(p => ({ ...p, countryId: e.target.value }))}>
                  <option value="">Any country</option>
                  {lookup.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Education */}
              <div>
                <label style={labelSt}>Education</label>
                <select style={selStyle} value={filters.educationId} onChange={e => setFilters(p => ({ ...p, educationId: e.target.value }))}>
                  <option value="">Any education</option>
                  {lookup.educations.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              {/* Mother Tongue */}
              <div>
                <label style={labelSt}>Mother Tongue</label>
                <select style={selStyle} value={filters.motherTongueId} onChange={e => setFilters(p => ({ ...p, motherTongueId: e.target.value }))}>
                  <option value="">Any language</option>
                  {lookup.motherTongues.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label style={labelSt}>Marital Status</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[{ label: 'Any', value: '' }, ...lookup.maritalStatuses].map(o => (
                    <button key={o.value} onClick={() => setFilters(p => ({ ...p, maritalStatus: p.maritalStatus === o.value ? '' : o.value }))}
                      style={{
                        padding: '5px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', border: '1.5px solid',
                        fontFamily: "'Outfit',sans-serif",
                        background: filters.maritalStatus === o.value ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'white',
                        color:  filters.maritalStatus === o.value ? 'white' : '#5A4A3A',
                        borderColor: filters.maritalStatus === o.value ? 'transparent' : '#D0C0B0',
                        transition: 'all .2s',
                      }}
                    >{o.label}</button>
                  ))}
                </div>
              </div>

              {/* Height range */}
              <div>
                <label style={labelSt}>Height (cm)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" placeholder="Min" min={122} max={220} style={{ ...selStyle, flex: 1 }} value={filters.minHeight} onChange={e => setFilters(p => ({ ...p, minHeight: e.target.value }))} />
                  <span style={{ color: '#9A8A7A', fontSize: 13, flexShrink: 0 }}>–</span>
                  <input type="number" placeholder="Max" min={122} max={220} style={{ ...selStyle, flex: 1 }} value={filters.maxHeight} onChange={e => setFilters(p => ({ ...p, maxHeight: e.target.value }))} />
                </div>
              </div>

              {/* Occupation */}
              <div>
                <label style={labelSt}>Occupation</label>
                <select style={selStyle} value={filters.occupationId} onChange={e => setFilters(p => ({ ...p, occupationId: e.target.value }))}>
                  <option value="">Any occupation</option>
                  {lookup.occupationGroups.map(g => (
                    <optgroup key={g.id} label={g.name}>
                      {g.occupations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Employment Status */}
              <div>
                <label style={labelSt}>Employment Status</label>
                <select style={selStyle} value={filters.employmentStatus} onChange={e => setFilters(p => ({ ...p, employmentStatus: e.target.value }))}>
                  <option value="">Any status</option>
                  {lookup.employmentStatuses.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Body Type */}
              <div>
                <label style={labelSt}>Body Type</label>
                <select style={selStyle} value={filters.bodyType} onChange={e => setFilters(p => ({ ...p, bodyType: e.target.value }))}>
                  <option value="">Any body type</option>
                  {lookup.bodyTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Physical Status */}
              <div>
                <label style={labelSt}>Physical Status</label>
                <select style={selStyle} value={filters.physicalStatus} onChange={e => setFilters(p => ({ ...p, physicalStatus: e.target.value }))}>
                  <option value="">Any</option>
                  {lookup.physicalStatuses.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Native Country */}
              <div>
                <label style={labelSt}>Native Country</label>
                <select style={selStyle} value={filters.nativeCountryId} onChange={e => setFilters(p => ({ ...p, nativeCountryId: e.target.value }))}>
                  <option value="">Any country</option>
                  {lookup.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Citizenship */}
              <div>
                <label style={labelSt}>Citizenship</label>
                <select style={selStyle} value={filters.citizenshipId} onChange={e => setFilters(p => ({ ...p, citizenshipId: e.target.value }))}>
                  <option value="">Any</option>
                  {lookup.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Eating Habits */}
              <div>
                <label style={labelSt}>Eating Habits</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lookup.eatingHabits.map(o => {
                    const active = filters.eatingHabits.includes(o.value);
                    return (
                      <button key={o.value}
                        onClick={() => setFilters(p => ({ ...p, eatingHabits: active ? p.eatingHabits.filter(v => v !== o.value) : [...p.eatingHabits, o.value] }))}
                        style={{ padding: '5px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', fontFamily: "'Outfit',sans-serif", background: active ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'white', color: active ? 'white' : '#5A4A3A', borderColor: active ? 'transparent' : '#D0C0B0', transition: 'all .2s' }}
                      >{o.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Smoking */}
              <div>
                <label style={labelSt}>Smoking</label>
                <select style={selStyle} value={filters.smokingHabit} onChange={e => setFilters(p => ({ ...p, smokingHabit: e.target.value }))}>
                  <option value="">Any</option>
                  {lookup.smokingHabits.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Drinking */}
              <div>
                <label style={labelSt}>Drinking</label>
                <select style={selStyle} value={filters.drinkingHabit} onChange={e => setFilters(p => ({ ...p, drinkingHabit: e.target.value }))}>
                  <option value="">Any</option>
                  {lookup.drinkingHabits.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Has Photo */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    onClick={() => setFilters(p => ({ ...p, hasPhoto: !p.hasPhoto }))}
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: filters.hasPhoto ? 'linear-gradient(135deg,#F4A435,#E8735A)' : '#D0C0B0',
                      position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background .3s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, width: 16, height: 16,
                      background: 'white', borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      left: filters.hasPhoto ? 21 : 3, transition: 'left .3s',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#2A1A1A', fontWeight: 500, fontFamily: "'Outfit',sans-serif" }}>Has Photo Only</span>
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                <button
                  onClick={() => handleSearch(1)}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg,#E8735A,#F4A435)',
                    color: 'white', border: 'none', borderRadius: 50,
                    padding: '11px 0', fontWeight: 700, fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                    opacity: loading ? 0.7 : 1, transition: 'opacity .2s',
                  }}
                >
                  {loading ? 'Searching…' : '🔍 Search'}
                </button>
                <button
                  onClick={clearAll}
                  style={{
                    background: 'transparent', border: 'none',
                    color: '#9A8A7A', fontSize: 12, cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>

          {/* ════════ RESULTS ════════ */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Result count */}
            {!loading && profiles.length > 0 && (
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>
                  Showing <strong style={{ color: '#2A1A1A' }}>{profiles.length}</strong> of <strong style={{ color: '#2A1A1A' }}>{total}</strong> profiles
                </span>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Empty */}
            {!loading && profiles.length === 0 && (
              <div style={{
                background: 'white', borderRadius: 24, textAlign: 'center',
                padding: '80px 40px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px dashed #F0E4D0',
              }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', marginBottom: 8 }}>
                  No profiles found
                </h3>
                <p style={{ color: '#7A6A5A', fontSize: 14, marginBottom: 24 }}>
                  Try adjusting your filters to find more matches.
                </p>
                <button
                  onClick={clearAll}
                  style={{
                    background: 'linear-gradient(135deg,#F4A435,#E8735A)',
                    color: 'white', border: 'none', borderRadius: 50,
                    padding: '12px 32px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Grid */}
            {!loading && profiles.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
                {profiles.map(p => <ProfileCard key={p.id} p={p} />)}
              </div>
            )}

            <Pagination page={page} pages={pages} onPage={p => handleSearch(p)} />
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Footer />
      </div>
    </div>
  );
}

export default function BrowsePublicPage() {
  return (
    <Suspense fallback={null}>
      <BrowsePublicPageInner />
    </Suspense>
  );
}
