'use client';
import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Select from 'react-select';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/auth';
import toast from 'react-hot-toast';
import InterestModal from '@/components/shared/InterestModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface LookupItem    { id: number; name: string; }
interface LookupOption  { id: number; value: string; label: string; icon?: string; }
interface OccupationGroup { id: number; name: string; occupations: LookupItem[]; }

interface LookupData {
  religions:        LookupItem[];
  countries:        LookupItem[];
  educations:       LookupItem[];
  motherTongues:    LookupItem[];
  maritalStatuses:  LookupOption[];
  bodyTypes:        LookupOption[];
  physicalStatuses: LookupOption[];
  smokingHabits:    LookupOption[];
  drinkingHabits:   LookupOption[];
  eatingHabits:     LookupOption[];
  employmentStatuses: LookupOption[];
  occupationGroups: OccupationGroup[];
}

interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  aboutMe?: string;
  countryLiving?: { id: number; name: string };
  religion?: { id: number; name: string };
  highestEducation?: { id: number; name: string };
  occupation?: { name: string };
  motherTongue?: { name: string };
  photos: { imageUrl: string }[];
  isVerified: boolean;
}

interface Filters {
  minAge:           string;
  maxAge:           string;
  religionId:       string;
  countryId:        string;
  nativeCountryId:  string;
  citizenshipId:    string;
  educationId:      string;
  maritalStatus:    string;
  hasPhoto:         boolean;
  motherTongueId:   string;
  minHeight:        string;
  maxHeight:        string;
  bodyType:         string;
  physicalStatus:   string;
  employmentStatus: string;
  occupationId:     string;
  eatingHabits:     string[];
  smokingHabit:     string;
  drinkingHabit:    string;
}

interface SavedSearch {
  id: number;
  name: string;
  filters: Partial<Filters>;
}

interface SelectOption { value: string; label: string; }

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function calcAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

const defaultFilters = (): Filters => ({
  minAge: '18', maxAge: '60',
  religionId: '', countryId: '', nativeCountryId: '', citizenshipId: '',
  educationId: '', maritalStatus: '', hasPhoto: false, motherTongueId: '',
  minHeight: '', maxHeight: '', bodyType: '', physicalStatus: '',
  employmentStatus: '', occupationId: '', eatingHabits: [],
  smokingHabit: '', drinkingHabit: '',
});

/* ─────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#F0E4D0]" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
      <div className="h-52 bg-[#F5EDE0] animate-pulse" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 rounded-full bg-[#F0E4D0] animate-pulse w-3/4" />
        <div className="h-3 rounded-full bg-[#F0E4D0] animate-pulse w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="h-5 rounded-full bg-[#F5EDE0] animate-pulse w-16" />
          <div className="h-5 rounded-full bg-[#F5EDE0] animate-pulse w-20" />
        </div>
        <div className="flex gap-2 mt-2">
          <div className="h-8 rounded-xl bg-[#F5EDE0] animate-pulse flex-1" />
          <div className="h-8 rounded-xl bg-[#F5EDE0] animate-pulse flex-[1.5]" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROFILE CARD
───────────────────────────────────────────── */
interface ProfileCardProps {
  profile: Profile;
  onSendInterest: (profile: Profile) => void;
  sentIds: Set<number>;
}

function ProfileCard({ profile: p, onSendInterest, sentIds }: ProfileCardProps) {
  const photo  = p.photos[0]?.imageUrl;
  const isSent = sentIds.has(p.id);
  const age    = calcAge(p.dateOfBirth);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-[#F0E4D0] transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(244,164,53,0.15)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
    >
      <div
        className="relative h-52 flex items-center justify-center"
        style={{ background: photo ? `url(${photo}) center/cover no-repeat` : 'linear-gradient(135deg,#F4A435,#E8735A)' }}
      >
        {!photo && <span className="text-6xl opacity-60">{p.gender === 'MALE' ? '👨' : '👩'}</span>}
        {p.isVerified && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-white text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: '#4ABEAA' }}>
            ✓ Verified
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '55%', background: 'linear-gradient(transparent,rgba(0,0,0,0.42))' }} />
        <div className="absolute bottom-3 left-3">
          <div className="text-white font-bold text-base leading-tight" style={{ fontFamily: "'Playfair Display',serif", textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {p.firstName} {p.lastName[0]}.
          </div>
          <div className="text-white/85 text-xs" style={{ fontFamily: "'Outfit',sans-serif" }}>
            {age} yrs · {p.countryLiving?.name ?? 'Unknown'}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[p.religion?.name, p.highestEducation?.name, p.occupation?.name]
            .filter(Boolean)
            .map((tag, i) => (
              <span key={i} className="text-[11px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: '#FFF3E0', color: '#E8735A' }}>
                {tag}
              </span>
            ))}
        </div>
        {p.aboutMe && (
          <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>
            {p.aboutMe}
          </p>
        )}
        <div className="flex gap-2">
          <Link href={`/dashboard/profile/${p.id}`} className="flex-1 text-center py-2 rounded-xl text-xs font-semibold no-underline transition-colors" style={{ background: '#F5F0EB', color: '#5A4A3A', fontFamily: "'Outfit',sans-serif" }}>
            View Profile
          </Link>
          <button
            onClick={() => !isSent && onSendInterest(p)}
            disabled={isSent}
            className="flex-[1.4] py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all disabled:cursor-default"
            style={isSent
              ? { background: '#FFFBF7', color: '#F4A435', borderColor: '#F4A435', fontFamily: "'Outfit',sans-serif" }
              : { background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderColor: 'transparent', fontFamily: "'Outfit',sans-serif" }
            }
          >
            {isSent ? '⏳ Request Sent' : '💌 Send Interest'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────── */
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
  const btnBase = { background: 'white', color: '#5A4A3A', fontFamily: "'Outfit',sans-serif", boxShadow: '0 2px 6px rgba(0,0,0,0.07)' };
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border-none transition-all disabled:opacity-40" style={btnBase}>← Prev</button>
      {nums.map((n, i) => n === '...' ? (
        <span key={`e-${i}`} className="px-1 text-sm" style={{ color: '#9A8A7A' }}>…</span>
      ) : (
        <button key={n} onClick={() => onPage(n as number)} className="w-9 h-9 rounded-xl text-sm font-medium cursor-pointer border-none transition-all" style={{ ...btnBase, background: n === page ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'white', color: n === page ? 'white' : '#5A4A3A', fontWeight: n === page ? 700 : 500 }}>{n}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === pages} className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border-none transition-all disabled:opacity-40" style={btnBase}>Next →</button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FILTER SECTION LABEL
───────────────────────────────────────────── */
function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-[#7A6A5A] mb-1.5 uppercase tracking-wide">
      {children}
    </label>
  );
}

/* ─────────────────────────────────────────────
   CHIP GROUP (single-select or toggle)
───────────────────────────────────────────── */
function ChipGroup({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[{ value: '', label: 'Any' }, ...options].map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(value === o.value ? '' : o.value)}
          className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all"
          style={{
            background: value === o.value ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'white',
            color: value === o.value ? 'white' : '#5A4A3A',
            borderColor: value === o.value ? 'transparent' : '#D0C0B0',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MULTI-CHIP GROUP
───────────────────────────────────────────── */
function MultiChipGroup({ options, values, onChange }: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const on = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(on ? values.filter(v => v !== o.value) : [...values, o.value])}
            className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all"
            style={{
              background: on ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'white',
              color: on ? 'white' : '#5A4A3A',
              borderColor: on ? 'transparent' : '#D0C0B0',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   REACT-SELECT STYLES
───────────────────────────────────────────── */
const selectStyles = {
  control: (base: Record<string, unknown>) => ({
    ...base,
    borderRadius: 12, borderColor: '#D0C0B0', boxShadow: 'none',
    minHeight: 38, fontSize: 13, fontFamily: "'Outfit',sans-serif",
    '&:hover': { borderColor: '#F4A435' },
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    fontSize: 13, fontFamily: "'Outfit',sans-serif",
    background: state.isSelected ? '#F4A435' : state.isFocused ? '#FFF3E0' : 'white',
    color: state.isSelected ? 'white' : '#2A1A1A',
  }),
  menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
};

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
function BrowsePageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { token }    = useAuthStore();

  const savedSearchId = searchParams.get('savedSearchId');
  const editSearchId  = searchParams.get('editSearch');
  const isNewSearch   = searchParams.get('newSearch') === '1';

  const [mounted,         setMounted]         = useState(false);
  const [filters,         setFilters]         = useState<Filters>(defaultFilters());
  const [profiles,        setProfiles]        = useState<Profile[]>([]);
  const [total,           setTotal]           = useState(0);
  const [page,            setPage]            = useState(1);
  const [pages,           setPages]           = useState(1);
  const [loading,         setLoading]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [sentIds,         setSentIds]         = useState<Set<number>>(new Set());
  const [showSaveModal,   setShowSaveModal]   = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [editingSearch,   setEditingSearch]   = useState<{ id: number; name: string } | null>(null);
  const [interestTarget,  setInterestTarget]  = useState<Profile | null>(null);
  const [interestSending, setInterestSending] = useState(false);
  // myGender stores THIS user's gender; oppositeGender is what we search for
  const [myGender,        setMyGender]        = useState('');
  const [oppositeGender,  setOppositeGender]  = useState('');
  const [lookup,          setLookup]          = useState<LookupData>({
    religions: [], countries: [], educations: [], motherTongues: [],
    maritalStatuses: [], bodyTypes: [], physicalStatuses: [],
    smokingHabits: [], drinkingHabits: [], eatingHabits: [],
    employmentStatuses: [], occupationGroups: [],
  });
  const [lookupLoaded,    setLookupLoaded]    = useState(false);

  useEffect(() => setMounted(true), []);

  const initKeyRef    = useRef('');
  // tracks whether we've done the initial default search (no saved search ID)
  const defaultSearchDoneRef = useRef(false);

  /* ── Build query string ── */
  // oppositeGender is always injected — user cannot override gender
  function buildQuery(f: Filters, p: number, oppGender: string): string {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (oppGender) params.set('gender', oppGender);
    if (f.minAge)           params.set('minAge',              f.minAge);
    if (f.maxAge)           params.set('maxAge',              f.maxAge);
    if (f.religionId)       params.set('religionId',          f.religionId);
    if (f.countryId)        params.set('countryLivingId',     f.countryId);
    if (f.nativeCountryId)  params.set('nativeCountryId',     f.nativeCountryId);
    if (f.citizenshipId)    params.set('citizenshipId',       f.citizenshipId);
    if (f.educationId)      params.set('highestEducationId',  f.educationId);
    if (f.maritalStatus)    params.set('maritalStatus',       f.maritalStatus);
    if (f.hasPhoto)         params.set('hasPhoto',            'true');
    if (f.motherTongueId)   params.set('motherTongueId',      f.motherTongueId);
    if (f.minHeight)        params.set('minHeight',           f.minHeight);
    if (f.maxHeight)        params.set('maxHeight',           f.maxHeight);
    if (f.bodyType)         params.set('bodyType',            f.bodyType);
    if (f.physicalStatus)   params.set('physicalStatus',      f.physicalStatus);
    if (f.employmentStatus) params.set('employmentStatus',    f.employmentStatus);
    if (f.occupationId)     params.set('occupationId',        f.occupationId);
    if (f.smokingHabit)     params.set('smokingHabit',        f.smokingHabit);
    if (f.drinkingHabit)    params.set('drinkingHabit',       f.drinkingHabit);
    if (f.eatingHabits.length > 0) params.set('eatingHabits', f.eatingHabits.join(','));
    return params.toString();
  }

  /* ── Run search ── */
  const runSearch = useCallback(async (f: Filters, p: number, oppGender: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const qs   = buildQuery(f, p, oppGender);
      const data = await apiGet<{ profiles: Profile[]; total: number; pages: number }>(
        `/api/profiles?${qs}`, token
      );
      setProfiles(data.profiles ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(p);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [token]);

  /* ── Load lookup data ── */
  useEffect(() => {
    if (!token || lookupLoaded) return;
    apiGet<{
      religions?: LookupItem[]; countries?: LookupItem[]; educations?: LookupItem[];
      motherTongues?: LookupItem[]; maritalStatuses?: LookupOption[];
      bodyTypes?: LookupOption[]; physicalStatuses?: LookupOption[];
      smokingHabits?: LookupOption[]; drinkingHabits?: LookupOption[];
      eatingHabits?: LookupOption[]; employmentStatuses?: LookupOption[];
      occupationGroups?: OccupationGroup[];
    }>('/api/profiles/lookup', token)
      .then(data => {
        setLookup({
          religions:         data.religions         ?? [],
          countries:         data.countries         ?? [],
          educations:        data.educations        ?? [],
          motherTongues:     data.motherTongues      ?? [],
          maritalStatuses:   data.maritalStatuses    ?? [],
          bodyTypes:         data.bodyTypes          ?? [],
          physicalStatuses:  data.physicalStatuses   ?? [],
          smokingHabits:     data.smokingHabits      ?? [],
          drinkingHabits:    data.drinkingHabits     ?? [],
          eatingHabits:      data.eatingHabits       ?? [],
          employmentStatuses: data.employmentStatuses ?? [],
          occupationGroups:  data.occupationGroups   ?? [],
        });
        setLookupLoaded(true);
      })
      .catch(() => setLookupLoaded(true));
  }, [token, lookupLoaded]);

  /* ── Load my gender → set oppositeGender → trigger default search ── */
  useEffect(() => {
    if (!token || myGender) return;
    apiGet<{ profile: { gender: string } | null }>('/api/profiles/me', token)
      .then(data => {
        const g   = data.profile?.gender ?? '';
        const opp = g === 'MALE' ? 'FEMALE' : g === 'FEMALE' ? 'MALE' : '';
        setMyGender(g);
        setOppositeGender(opp);
        // Run initial search only if no saved/edit search is being loaded
        if (!savedSearchId && !editSearchId && !defaultSearchDoneRef.current) {
          defaultSearchDoneRef.current = true;
          const f = defaultFilters();
          setFilters(f);
          runSearch(f, 1, opp);
        }
      })
      .catch(() => {
        // If no profile yet, still run a blank search
        if (!savedSearchId && !editSearchId && !defaultSearchDoneRef.current) {
          defaultSearchDoneRef.current = true;
          runSearch(defaultFilters(), 1, '');
        }
      });
  }, [token, myGender, savedSearchId, editSearchId, runSearch]);

  /* ── Handle saved/edit search from URL params ── */
  useEffect(() => {
    if (!token) return;
    const key = `${editSearchId ?? ''}|${savedSearchId ?? ''}|${isNewSearch}`;
    if (initKeyRef.current === key) return;
    if (!editSearchId && !savedSearchId && !isNewSearch) return; // handled by myGender effect
    initKeyRef.current = key;

    async function init() {
      const targetId = editSearchId ?? savedSearchId;
      if (targetId) {
        try {
          const data = await apiGet<{ data: SavedSearch }>(`/api/searches/${targetId}`, token!);
          const s = data.data;
          if (s?.filters) {
            const merged: Filters = {
              ...defaultFilters(),
              ...s.filters,
              religionId:     String((s.filters as Filters).religionId     ?? ''),
              countryId:      String((s.filters as Filters).countryId      ?? ''),
              nativeCountryId: String((s.filters as Filters).nativeCountryId ?? ''),
              citizenshipId:  String((s.filters as Filters).citizenshipId   ?? ''),
              educationId:    String((s.filters as Filters).educationId    ?? ''),
              motherTongueId: String((s.filters as Filters).motherTongueId ?? ''),
              occupationId:   String((s.filters as Filters).occupationId   ?? ''),
              eatingHabits:   Array.isArray((s.filters as Filters).eatingHabits) ? (s.filters as Filters).eatingHabits : [],
            };
            setFilters(merged);
            if (editSearchId) {
              setEditingSearch({ id: s.id, name: s.name });
              setSavedSearchName(s.name);
            } else {
              runSearch(merged, 1, oppositeGender);
            }
          }
        } catch {
          toast.error('Could not load saved search');
          runSearch(defaultFilters(), 1, oppositeGender);
        }
        return;
      }
      if (isNewSearch) {
        defaultSearchDoneRef.current = true;
        const fresh = defaultFilters();
        setFilters(fresh);
        setEditingSearch(null);
        setSavedSearchName('');
        runSearch(fresh, 1, oppositeGender);
      }
    }
    init();
  }, [token, editSearchId, savedSearchId, isNewSearch, runSearch, oppositeGender]);

  /* ── Pre-load already-sent match receiver IDs ── */
  useEffect(() => {
    if (!token) return;
    apiGet<{ matches: { receiver?: { id: number }; status: string }[] }>('/api/matches/sent', token)
      .then(d => {
        const ids = new Set(
          d.matches
            .filter(m => m.status === 'PENDING' || m.status === 'ACCEPTED')
            .map(m => m.receiver?.id)
            .filter((id): id is number => !!id)
        );
        setSentIds(ids);
      })
      .catch(() => {});
  }, [token]);

  /* ── Send interest ── */
  function openInterestModal(profile: Profile) {
    setInterestTarget(profile);
  }

  async function confirmSendInterest(message: string) {
    if (!token || !interestTarget) return;
    setInterestSending(true);
    try {
      const res = await fetch(`${API}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: interestTarget.id, message: message || undefined }),
      });
      if (res.ok) {
        setSentIds(prev => new Set(prev).add(interestTarget.id));
        toast.success('Request sent! Check your inbox to see the conversation.');
        setInterestTarget(null);
      } else {
        const d = await res.json();
        toast.error(d.message ?? 'Could not send interest');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setInterestSending(false);
    }
  }

  function handleSearch(p = 1) { runSearch(filters, p, oppositeGender); }

  async function handleSaveSearch() {
    if (!savedSearchName.trim()) { toast.error('Please enter a name for your search'); return; }
    if (!token) return;
    setSaving(true);
    try {
      const body = { name: savedSearchName.trim(), filters };
      if (editingSearch) {
        const res = await fetch(`${API}/api/searches/${editingSearch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message ?? 'Update failed'); }
        toast.success('Search updated!');
        setEditingSearch({ id: editingSearch.id, name: savedSearchName.trim() });
        initKeyRef.current = `${editingSearch.id}||false`;
        router.replace(`/dashboard/browse?editSearch=${editingSearch.id}`);
      } else {
        const res = await fetch(`${API}/api/searches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message ?? 'Save failed'); }
        const data = await res.json();
        toast.success('Search saved!');
        const newId = data.data?.id;
        if (newId) {
          setEditingSearch({ id: newId, name: savedSearchName.trim() });
          initKeyRef.current = `${newId}||false`;
          router.replace(`/dashboard/browse?editSearch=${newId}`);
        }
      }
      setShowSaveModal(false);
      setSavedSearchName('');
      runSearch(filters, 1, oppositeGender);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save search');
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    defaultSearchDoneRef.current = true;
    const fresh = defaultFilters();
    setFilters(fresh);
    setEditingSearch(null);
    setSavedSearchName('');
    initKeyRef.current = '';
    router.replace('/dashboard/browse');
    runSearch(fresh, 1, oppositeGender);
  }

  function toOptions(items: LookupItem[]): SelectOption[] {
    return items.map(i => ({ value: String(i.id), label: i.name }));
  }

  // Build grouped occupation options
  const occupationGroupedOptions = lookup.occupationGroups.map(g => ({
    label: g.name,
    options: g.occupations.map(o => ({ value: String(o.id), label: o.name })),
  }));

  const currentOccupationOption = occupationGroupedOptions
    .flatMap(g => g.options)
    .find(o => o.value === filters.occupationId) ?? null;

  const inp = 'w-full rounded-xl border border-[#D0C0B0] px-3 py-2 text-sm focus:outline-none focus:border-[#F4A435] focus:ring-2 focus:ring-[#F4A435]/20 bg-white';

  /* ── Count active filters ── */
  const activeCount = [
    filters.religionId, filters.countryId, filters.nativeCountryId,
    filters.citizenshipId, filters.educationId, filters.maritalStatus,
    filters.motherTongueId, filters.minHeight, filters.maxHeight,
    filters.bodyType, filters.physicalStatus, filters.employmentStatus,
    filters.occupationId, filters.smokingHabit, filters.drinkingHabit,
  ].filter(Boolean).length
    + (filters.eatingHabits.length > 0 ? 1 : 0)
    + (filters.hasPhoto ? 1 : 0)
    + (filters.minAge !== '18' || filters.maxAge !== '60' ? 1 : 0);

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Page title bar */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2A1A1A] mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
            Browse Profiles 🔍
          </h1>
          {editingSearch && (
            <div className="flex items-center gap-2 text-sm text-[#7A6A5A]">
              <span>Editing:</span>
              <span className="font-semibold text-[#E8735A]">{editingSearch.name}</span>
              <button onClick={clearFilters} className="text-xs text-[#9A8A7A] underline cursor-pointer bg-transparent border-none">Cancel</button>
            </div>
          )}
        </div>
        {total > 0 && !loading && (
          <p className="text-sm" style={{ color: '#7A6A5A' }}>
            Showing <span className="font-semibold text-[#2A1A1A]">{profiles.length}</span> of{' '}
            <span className="font-semibold text-[#2A1A1A]">{total}</span> profiles
          </p>
        )}
      </div>

      <div className="flex gap-5 items-start">

        {/* ════════ SIDEBAR ════════ */}
        <div
          className="flex-shrink-0 bg-white rounded-2xl border border-[#F0E4D0] p-5"
          style={{ width: 290, position: 'sticky', top: 74, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#2A1A1A]" style={{ fontFamily: "'Playfair Display',serif" }}>
              Filter Search
            </h2>
            {activeCount > 0 && (
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#E8735A' }}>
                {activeCount} active
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">

            {/* ── Age Range ── */}
            <div>
              <FilterLabel>Age Range</FilterLabel>
              <div className="flex items-center gap-2">
                <input type="number" min={18} max={80} value={filters.minAge} onChange={e => setFilters(prev => ({ ...prev, minAge: e.target.value }))} className={inp} placeholder="Min" />
                <span className="text-[#9A8A7A] text-xs flex-shrink-0">–</span>
                <input type="number" min={18} max={80} value={filters.maxAge} onChange={e => setFilters(prev => ({ ...prev, maxAge: e.target.value }))} className={inp} placeholder="Max" />
              </div>
            </div>

            {/* ── Height Range (cm) ── */}
            <div>
              <FilterLabel>Height (cm)</FilterLabel>
              <div className="flex items-center gap-2">
                <input type="number" min={100} max={220} value={filters.minHeight} onChange={e => setFilters(prev => ({ ...prev, minHeight: e.target.value }))} className={inp} placeholder="Min" />
                <span className="text-[#9A8A7A] text-xs flex-shrink-0">–</span>
                <input type="number" min={100} max={220} value={filters.maxHeight} onChange={e => setFilters(prev => ({ ...prev, maxHeight: e.target.value }))} className={inp} placeholder="Max" />
              </div>
            </div>

            {/* ── Religion ── */}
            <div>
              <FilterLabel>Religion</FilterLabel>
              <Select instanceId="f-religion" isClearable placeholder="Any religion" options={toOptions(lookup.religions)} value={toOptions(lookup.religions).find(o => o.value === filters.religionId) ?? null} onChange={opt => setFilters(prev => ({ ...prev, religionId: opt?.value ?? '' }))} styles={selectStyles} menuPortalTarget={mounted ? document.body : undefined} />
            </div>

            {/* ── Mother Tongue ── */}
            <div>
              <FilterLabel>Mother Tongue</FilterLabel>
              <Select instanceId="f-tongue" isClearable placeholder="Any language" options={toOptions(lookup.motherTongues)} value={toOptions(lookup.motherTongues).find(o => o.value === filters.motherTongueId) ?? null} onChange={opt => setFilters(prev => ({ ...prev, motherTongueId: opt?.value ?? '' }))} styles={selectStyles} menuPortalTarget={mounted ? document.body : undefined} />
            </div>

            {/* ── Country Living ── */}
            <div>
              <FilterLabel>Country Living In</FilterLabel>
              <Select instanceId="f-country" isClearable placeholder="Any country" options={toOptions(lookup.countries)} value={toOptions(lookup.countries).find(o => o.value === filters.countryId) ?? null} onChange={opt => setFilters(prev => ({ ...prev, countryId: opt?.value ?? '' }))} styles={selectStyles} menuPortalTarget={mounted ? document.body : undefined} />
            </div>

            {/* ── Native Country ── */}
            <div>
              <FilterLabel>Native Country</FilterLabel>
              <Select instanceId="f-native" isClearable placeholder="Any country" options={toOptions(lookup.countries)} value={toOptions(lookup.countries).find(o => o.value === filters.nativeCountryId) ?? null} onChange={opt => setFilters(prev => ({ ...prev, nativeCountryId: opt?.value ?? '' }))} styles={selectStyles} menuPortalTarget={mounted ? document.body : undefined} />
            </div>

            {/* ── Citizenship ── */}
            <div>
              <FilterLabel>Citizenship</FilterLabel>
              <Select instanceId="f-citizenship" isClearable placeholder="Any country" options={toOptions(lookup.countries)} value={toOptions(lookup.countries).find(o => o.value === filters.citizenshipId) ?? null} onChange={opt => setFilters(prev => ({ ...prev, citizenshipId: opt?.value ?? '' }))} styles={selectStyles} menuPortalTarget={mounted ? document.body : undefined} />
            </div>

            {/* ── Education ── */}
            <div>
              <FilterLabel>Education</FilterLabel>
              <Select instanceId="f-education" isClearable placeholder="Any education" options={toOptions(lookup.educations)} value={toOptions(lookup.educations).find(o => o.value === filters.educationId) ?? null} onChange={opt => setFilters(prev => ({ ...prev, educationId: opt?.value ?? '' }))} styles={selectStyles} menuPortalTarget={mounted ? document.body : undefined} />
            </div>

            {/* ── Occupation ── */}
            <div>
              <FilterLabel>Occupation</FilterLabel>
              <Select instanceId="f-occupation" isClearable placeholder="Any occupation" options={occupationGroupedOptions} value={currentOccupationOption} onChange={opt => setFilters(prev => ({ ...prev, occupationId: opt?.value ?? '' }))} styles={selectStyles} menuPortalTarget={mounted ? document.body : undefined} />
            </div>

            {/* ── Employment Status ── */}
            {lookup.employmentStatuses.length > 0 && (
              <div>
                <FilterLabel>Employment</FilterLabel>
                <ChipGroup options={lookup.employmentStatuses.map(o => ({ value: o.value, label: o.label }))} value={filters.employmentStatus} onChange={v => setFilters(prev => ({ ...prev, employmentStatus: v }))} />
              </div>
            )}

            {/* ── Marital Status ── */}
            <div>
              <FilterLabel>Marital Status</FilterLabel>
              <ChipGroup options={lookup.maritalStatuses.map(o => ({ value: o.value, label: o.label }))} value={filters.maritalStatus} onChange={v => setFilters(prev => ({ ...prev, maritalStatus: v }))} />
            </div>

            {/* ── Body Type ── */}
            {lookup.bodyTypes.length > 0 && (
              <div>
                <FilterLabel>Body Type</FilterLabel>
                <ChipGroup options={lookup.bodyTypes.map(o => ({ value: o.value, label: o.label }))} value={filters.bodyType} onChange={v => setFilters(prev => ({ ...prev, bodyType: v }))} />
              </div>
            )}

            {/* ── Physical Status ── */}
            {lookup.physicalStatuses.length > 0 && (
              <div>
                <FilterLabel>Physical Status</FilterLabel>
                <ChipGroup options={lookup.physicalStatuses.map(o => ({ value: o.value, label: o.label }))} value={filters.physicalStatus} onChange={v => setFilters(prev => ({ ...prev, physicalStatus: v }))} />
              </div>
            )}

            {/* ── Eating Habits ── */}
            {lookup.eatingHabits.length > 0 && (
              <div>
                <FilterLabel>Eating Habits</FilterLabel>
                <MultiChipGroup options={lookup.eatingHabits.map(o => ({ value: o.value, label: o.label }))} values={filters.eatingHabits} onChange={v => setFilters(prev => ({ ...prev, eatingHabits: v }))} />
              </div>
            )}

            {/* ── Smoking Habit ── */}
            {lookup.smokingHabits.length > 0 && (
              <div>
                <FilterLabel>Smoking</FilterLabel>
                <ChipGroup options={lookup.smokingHabits.map(o => ({ value: o.value, label: o.label }))} value={filters.smokingHabit} onChange={v => setFilters(prev => ({ ...prev, smokingHabit: v }))} />
              </div>
            )}

            {/* ── Drinking Habit ── */}
            {lookup.drinkingHabits.length > 0 && (
              <div>
                <FilterLabel>Drinking</FilterLabel>
                <ChipGroup options={lookup.drinkingHabits.map(o => ({ value: o.value, label: o.label }))} value={filters.drinkingHabit} onChange={v => setFilters(prev => ({ ...prev, drinkingHabit: v }))} />
              </div>
            )}

            {/* ── Has Photo ── */}
            <div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setFilters(prev => ({ ...prev, hasPhoto: !prev.hasPhoto }))}
                  className="relative flex-shrink-0 w-9 h-5 rounded-full transition-all cursor-pointer"
                  style={{ background: filters.hasPhoto ? 'linear-gradient(135deg,#F4A435,#E8735A)' : '#D0C0B0' }}
                >
                  <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all" style={{ left: filters.hasPhoto ? '18px' : '2px' }} />
                </div>
                <span className="text-sm text-[#2A1A1A] font-medium">Has Photo Only</span>
              </label>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleSearch(1)}
                disabled={loading}
                className="w-full py-2.5 rounded-full text-sm font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg,#E8735A,#F4A435)' }}
              >
                {loading ? 'Searching…' : '🔍 Search'}
              </button>
              <button
                onClick={() => { if (editingSearch) setSavedSearchName(editingSearch.name); setShowSaveModal(true); }}
                className="w-full py-2.5 rounded-full text-sm font-bold cursor-pointer transition-all border"
                style={{ background: 'transparent', color: '#F4A435', borderColor: '#F4A435' }}
              >
                💾 {editingSearch ? 'Update Search' : 'Save & Search'}
              </button>
              <button onClick={clearFilters} className="text-xs text-[#9A8A7A] cursor-pointer bg-transparent border-none hover:text-[#E8735A] transition-colors">
                Clear filters
              </button>
            </div>
          </div>
        </div>

        {/* ════════ RESULTS ════════ */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && profiles.length === 0 && (
            <div className="bg-white rounded-2xl text-center py-16 px-8 border border-dashed border-[#F0E4D0]" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-bold text-[#2A1A1A] text-lg mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>No profiles found</h3>
              <p className="text-sm text-[#7A6A5A] mb-5">Try adjusting your filters to find more matches.</p>
              <button onClick={clearFilters} className="px-6 py-2.5 rounded-full text-sm font-bold text-white border-none cursor-pointer" style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}>
                Clear Filters
              </button>
            </div>
          )}

          {!loading && profiles.length > 0 && (
            <>
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
                {profiles.map(p => <ProfileCard key={p.id} profile={p} onSendInterest={openInterestModal} sentIds={sentIds} />)}
              </div>
              <Pagination page={page} pages={pages} onPage={p => handleSearch(p)} />
            </>
          )}
        </div>
      </div>

      {/* ════════ INTEREST MESSAGE MODAL ════════ */}
      {interestTarget && (
        <InterestModal
          recipientName={interestTarget.firstName}
          onSend={confirmSendInterest}
          onClose={() => setInterestTarget(null)}
          loading={interestSending}
        />
      )}

      {/* ════════ SAVE SEARCH MODAL ════════ */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
            <h3 className="font-bold text-[#2A1A1A] text-lg mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              💾 {editingSearch ? 'Update Search' : 'Save This Search'}
            </h3>
            <p className="text-sm text-[#7A6A5A] mb-5">Give your search a name so you can quickly run it again.</p>
            <div className="mb-2">
              <label className="block text-xs font-semibold text-[#7A6A5A] mb-1.5 uppercase tracking-wide">Search Name (max 10 chars)</label>
              <input type="text" maxLength={10} value={savedSearchName} onChange={e => setSavedSearchName(e.target.value)} placeholder="e.g. UK Matches" className={inp} />
              <div className="text-right text-[11px] text-[#9A8A7A] mt-1">{savedSearchName.length}/10</div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowSaveModal(false); setSavedSearchName(''); }} className="flex-1 py-2.5 rounded-full text-sm font-semibold cursor-pointer border border-[#D0C0B0] bg-white text-[#5A4A3A]">Cancel</button>
              <button onClick={handleSaveSearch} disabled={saving || !savedSearchName.trim()} className="flex-[1.4] py-2.5 rounded-full text-sm font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}>
                {saving ? 'Saving…' : editingSearch ? 'Update' : 'Save & Search'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 80, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading…</div>}>
      <BrowsePageInner />
    </Suspense>
  );
}
