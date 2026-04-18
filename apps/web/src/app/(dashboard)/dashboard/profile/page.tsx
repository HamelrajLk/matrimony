'use client';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Select from 'react-select';
import { useAuthStore } from '@/store/authStore';
import { apiGet, apiPut } from '@/lib/auth';
import toast from 'react-hot-toast';
import DateOfBirthPicker from '@/components/shared/DateOfBirthPicker';
import { buildCurrencyOptions } from '@/lib/profile-constants';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LookupItem { id: number; name: string; }
interface CountryItem { id: number; name: string; currency?: string | null; }
interface OccGroup { id: number; name: string; occupations: LookupItem[]; }
interface BodyTypeItem { id: number; value: string; label: string; description: string; svgContent?: string | null; }
interface LookupOption { id: number; value: string; label: string; icon?: string | null; sortOrder?: number; }
interface HobbyOption { id: number; value: string; label: string; category: string; categoryLabel: string; categoryEmoji: string; sortOrder: number; }
interface LookupData {
  countries: CountryItem[]; religions: LookupItem[]; motherTongues: LookupItem[];
  educations: LookupItem[]; occupationGroups: OccGroup[];
  bodyTypes: BodyTypeItem[];
  maritalStatuses: LookupOption[];
  genders: LookupOption[];
  physicalStatuses: LookupOption[];
  smokingHabits: LookupOption[];
  drinkingHabits: LookupOption[];
  eatingHabits: LookupOption[];
  employmentStatuses: LookupOption[];
  profileCreatedBy: LookupOption[];
  hobbyOptions: HobbyOption[];
  musicOptions: LookupOption[];
  sportOptions: LookupOption[];
  foodOptions: LookupOption[];
}
interface Photo { id: number; imageUrl: string; isPrimary: boolean; }
interface Profile {
  id: number; firstName: string; lastName: string; gender: string;
  dateOfBirth: string; maritalStatus: string; createdByType: string;
  height?: number; weight?: number; bodyType?: string; physicalStatus?: string; bloodGroup?: string;
  religionId?: number; denomination?: string; motherTongueId?: number;
  religion?: { name: string }; motherTongue?: { name: string };
  eatingHabits?: string[]; smokingHabit?: string; drinkingHabit?: string; aboutMe?: string;
  highestEducationId?: number; employmentStatus?: string; occupationId?: number;
  highestEducation?: { name: string }; occupation?: { name: string };
  annualIncome?: number; currency?: string;
  fatherName?: string; fatherOccupationId?: number; motherName?: string; motherOccupationId?: number;
  fatherOccupation?: { name: string }; motherOccupation?: { name: string };
  noOfBrothers?: number; brothersMarried?: number; noOfSisters?: number; sistersMarried?: number; aboutFamily?: string;
  nativeCountryId?: number; nativeCountryState?: string; nativeCountryCity?: string;
  countryLivingId?: number; countryLivingState?: string; countryLivingCity?: string;
  citizenshipId?: number;
  grewUpInCountryIds?: number[];
  nativeCountry?: { name: string }; countryLiving?: { name: string }; citizenship?: { name: string };
  hobbies?: string[];
  favMusic?: string[];
  favMusicOther?: string;
  favSports?: string[];
  favSportsOther?: string;
  favFood?: string[];
  photos: Photo[]; preference?: any; status: string;
}

// ─── Constants ──────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(e?: string | null) { return e ? e.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'; }
function calcAge(dob: string) { return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)); }
function toFtIn(cm: number) { const i = Math.round(cm / 2.54); return `${Math.floor(i / 12)}' ${i % 12}"`; }
function labelOf(arr: { value: string; label: string }[], v?: string | null) { return arr.find(a => a.value === v)?.label.replace(/^[^a-zA-Z]+/, '') || '—'; }

// ─── react-select styles ──────────────────────────────────────────────────────
const rsStyles = {
  control: (b: any, s: any) => ({ ...b, borderColor: s.isFocused ? '#F4A435' : '#F0E4D0', borderRadius: 10, boxShadow: s.isFocused ? '0 0 0 2px rgba(244,164,53,0.2)' : 'none', fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', minHeight: 42 }),
  option: (b: any, s: any) => ({ ...b, background: s.isSelected ? '#F4A435' : s.isFocused ? '#FFF3E0' : 'white', color: s.isSelected ? 'white' : '#2A1A1A', fontFamily: "'Outfit',sans-serif", fontSize: '0.86rem' }),
  singleValue: (b: any) => ({ ...b, fontFamily: "'Outfit',sans-serif", color: '#2A1A1A' }),
  placeholder: (b: any) => ({ ...b, color: '#C0B0A0', fontFamily: "'Outfit',sans-serif" }),
  menu: (b: any) => ({ ...b, borderRadius: 12, border: '1px solid #F0E4D0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 50 }),
};

// ─── UI Components ────────────────────────────────────────────────────────────

/** Pill-style radio buttons — no native browser circles */
function RadioPills({ options, value, onChange }: { options: { value: string; label: string }[]; value?: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer ${
            value === opt.value
              ? 'bg-gradient-to-r from-[#F4A435] to-[#E8735A] text-white border-transparent shadow-sm'
              : 'bg-white text-[#5A4A3A] border-[#E8D8C8] hover:border-[#F4A435] hover:text-[#E8735A]'
          }`}
          style={{ fontFamily: "'Outfit',sans-serif" }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Pill checkboxes for multi-select */
function CheckPills({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const on = value.includes(opt.value);
        return (
          <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer ${
              on ? 'bg-gradient-to-r from-[#F4A435] to-[#E8735A] text-white border-transparent shadow-sm'
                 : 'bg-white text-[#5A4A3A] border-[#E8D8C8] hover:border-[#F4A435]'
            }`}
            style={{ fontFamily: "'Outfit',sans-serif" }}
          >
            {on ? '✓ ' : ''}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Scrollable radio list for long lookup lists (mother tongue, etc.) */
function RadioList({ items, value, onChange }: { items: LookupItem[]; value?: number | null; onChange: (v: string) => void }) {
  return (
    <div className="max-h-48 overflow-y-auto rounded-xl border border-[#F0E4D0] divide-y divide-[#FAF0E8]">
      {items.map(item => (
        <button key={item.id} type="button" onClick={() => onChange(String(item.id))}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
            value === item.id ? 'bg-[#FFF3E0]' : 'bg-white hover:bg-[#FFFBF7]'
          }`}
        >
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${value === item.id ? 'border-[#F4A435]' : 'border-[#D0C0B0]'}`}>
            {value === item.id && <div className="w-2 h-2 rounded-full bg-[#F4A435]" />}
          </div>
          <span style={{ fontFamily: "'Outfit',sans-serif" }} className={`text-sm ${value === item.id ? 'font-semibold text-[#E8735A]' : 'text-[#2A1A1A]'}`}>{item.name}</span>
        </button>
      ))}
    </div>
  );
}

/** Visual height picker with vertical ruler */
function HeightPicker({ value = 165, onChange }: { value?: number; onChange: (v: number) => void }) {
  const MIN = 140, MAX = 215;
  const pct = (value - MIN) / (MAX - MIN);
  const ticks = Array.from({ length: Math.floor((MAX - MIN) / 5) + 1 }, (_, i) => MIN + i * 5);

  return (
    <div className="flex items-center gap-6 p-5 bg-[#FFFBF7] rounded-2xl border border-[#F0E4D0]">
      {/* Vertical ruler */}
      <div className="relative flex-none bg-[#F5F0EB] rounded-xl border border-[#E8D8C8]" style={{ width: 44, height: 240 }}>
        {ticks.map(h => {
          const y = (1 - (h - MIN) / (MAX - MIN)) * 218 + 11;
          const isLabel = h % 10 === 0;
          return (
            <div key={h} style={{ position: 'absolute', top: y, left: 0, right: 0, display: 'flex', alignItems: 'center' }}>
              {isLabel && <span style={{ fontSize: '8px', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", paddingLeft: 3, lineHeight: 1, flexShrink: 0 }}>{h}</span>}
              <div style={{ marginLeft: 'auto', width: isLabel ? '45%' : '28%', height: '1.5px', background: '#C8B8A8' }} />
            </div>
          );
        })}
        {/* Gold indicator */}
        <div className="absolute left-0 right-0 transition-all duration-100"
          style={{ top: `${(1 - pct) * 218 + 11}px`, height: 3, background: '#F4A435', boxShadow: '0 0 8px rgba(244,164,53,0.6)', borderRadius: 2 }}
        >
          <div style={{ position: 'absolute', right: -1, top: -3, width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: '7px solid #F4A435' }} />
        </div>
      </div>

      {/* Display + slider */}
      <div className="flex-1">
        <div style={{ fontFamily: "'Outfit',sans-serif" }} className="mb-1">
          <span className="text-5xl font-bold text-[#2A1A1A]">{value}</span>
          <span className="text-base text-[#9A8A7A] ml-1.5">cm</span>
        </div>
        <div className="text-2xl text-[#7A6A5A] mb-5" style={{ fontFamily: "'Outfit',sans-serif" }}>{toFtIn(value)}</div>
        <input type="range" min={MIN} max={MAX} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: '#F4A435', background: `linear-gradient(to right, #F4A435 ${pct * 100}%, #F0E4D0 ${pct * 100}%)` }}
        />
        <div className="flex justify-between text-xs text-[#9A8A7A] mt-2" style={{ fontFamily: "'Outfit',sans-serif" }}>
          <span>4'7" (140cm)</span><span>7'0" (215cm)</span>
        </div>
      </div>
    </div>
  );
}

interface BodyTypeOption { value: string; label: string; description: string; svgContent?: string | null; }

/** Body type picker with silhouette icons from DB */
function BodyTypePicker({ value, onChange, options }: { value?: string | null; onChange: (v: string) => void; options: BodyTypeOption[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {options.map(bt => (
        <button key={bt.value} type="button" onClick={() => onChange(bt.value)}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-150 cursor-pointer ${
            value === bt.value
              ? 'border-[#F4A435] bg-[#FFF3E0] shadow-sm'
              : 'border-[#F0E4D0] bg-white hover:border-[#F4A435]/50'
          }`}
        >
          {bt.svgContent && (
            <div className={`transition-colors ${value === bt.value ? 'text-[#F4A435]' : 'text-[#C0B0A0]'}`}>
              <svg viewBox="0 0 28 56" fill="currentColor" style={{ width: 24, height: 48, display: 'block', margin: '0 auto' }}
                dangerouslySetInnerHTML={{ __html: bt.svgContent }} />
            </div>
          )}
          <span style={{ fontFamily: "'Outfit',sans-serif" }} className={`text-xs font-bold ${value === bt.value ? 'text-[#E8735A]' : 'text-[#7A6A5A]'}`}>{bt.label}</span>
          <span style={{ fontFamily: "'Outfit',sans-serif" }} className="text-[10px] text-[#9A8A7A]">{bt.description}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon, editing, onEdit, onSave, onCancel, saving, children }: {
  title: string; icon: string; editing: boolean;
  onEdit: () => void; onSave: () => void; onCancel: () => void;
  saving: boolean; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#F0E4D0] shadow-sm overflow-hidden">
      <div className={`flex items-center justify-between px-6 py-4 border-b border-[#F0E4D0] ${editing ? 'bg-[#FFFBF7]' : ''}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <span style={{ fontFamily: "'Playfair Display',serif" }} className="font-bold text-[#2A1A1A] text-base">{title}</span>
        </div>
        {!editing && (
          <button onClick={onEdit} style={{ fontFamily: "'Outfit',sans-serif" }}
            className="border border-[#F4A435] text-[#E8735A] rounded-lg px-4 py-1.5 text-sm font-semibold hover:bg-[#FFF3E0] transition-colors cursor-pointer">
            ✏️ Edit
          </button>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
      {editing && (
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#F0E4D0] bg-[#FFFBF7]">
          <button onClick={onCancel} style={{ fontFamily: "'Outfit',sans-serif" }}
            className="border border-[#D0C0B0] text-[#7A6A5A] rounded-lg px-5 py-2 text-sm font-semibold hover:bg-[#FAF0E8] transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ fontFamily: "'Outfit',sans-serif" }}
            className="bg-gradient-to-r from-[#F4A435] to-[#E8735A] text-white rounded-lg px-5 py-2 text-sm font-bold disabled:opacity-60 cursor-pointer">
            {saving ? '⏳ Saving…' : '💾 Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Read-only info row */
function Row({ l, v }: { l: string; v?: string | number | null }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-[#FAF0E8] last:border-0">
      <div style={{ fontFamily: "'Outfit',sans-serif" }} className="w-40 flex-shrink-0 text-[11px] font-semibold text-[#9A8A7A] uppercase tracking-wide pt-0.5">{l}</div>
      <div style={{ fontFamily: "'Outfit',sans-serif" }} className={`text-sm ${v ? 'text-[#2A1A1A]' : 'text-[#C0B0A0]'}`}>{v ? String(v) : '—'}</div>
    </div>
  );
}

/** Field wrapper */
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label style={{ fontFamily: "'Outfit',sans-serif" }} className="block text-xs font-semibold text-[#5A4A3A] mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// ─── Photo Section ────────────────────────────────────────────────────────────
function PhotoSection({ profile, token, onRefresh }: { profile: Profile; token: string | null; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photos = profile.photos || [];
  const canUpload = 10 - photos.length;

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    if (photos.length >= 10) { toast.error('Maximum 10 photos allowed'); return; }
    setUploading(true);
    const fd = new FormData();
    Array.from(files).slice(0, canUpload).forEach(f => fd.append('photos', f));
    try {
      const res = await fetch(`${API}/api/profiles/me/photos`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      res.ok ? (toast.success(data.message), onRefresh()) : toast.error(data.message);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function deletePhoto(id: number) {
    if (!confirm('Delete this photo?')) return;
    const res = await fetch(`${API}/api/profiles/me/photos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    res.ok ? (toast.success('Deleted'), onRefresh()) : toast.error('Failed');
  }

  async function setPrimary(id: number) {
    const res = await fetch(`${API}/api/profiles/me/photos/${id}/primary`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    res.ok ? (toast.success('Profile picture updated'), onRefresh()) : toast.error('Failed');
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F0E4D0] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[#F0E4D0]">
        <span className="text-xl">📸</span>
        <span style={{ fontFamily: "'Playfair Display',serif" }} className="font-bold text-[#2A1A1A] text-base">Photos</span>
        <span style={{ fontFamily: "'Outfit',sans-serif" }} className="ml-auto text-xs text-[#9A8A7A]">{photos.length}/10 uploaded</span>
      </div>
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-green-50 rounded-xl p-3.5 border border-green-200">
            <div style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2">Good Photos ✅</div>
            {['Clear face in good lighting', 'Formal or semi-formal attire', 'Solo photo (just you)', 'Smiling, confident', 'Min 600×600px quality'].map(d => (
              <div key={d} style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs text-green-700 mb-1">• {d}</div>
            ))}
          </div>
          <div className="bg-red-50 rounded-xl p-3.5 border border-red-200">
            <div style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2">Avoid These ❌</div>
            {['Sunglasses or hidden face', 'Group photos', 'Blurry or dark images', 'Heavy filters', 'Inappropriate clothing'].map(d => (
              <div key={d} style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs text-red-700 mb-1">• {d}</div>
            ))}
          </div>
        </div>
        {canUpload > 0 && (
          <div onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${dragOver ? 'border-[#F4A435] bg-[#FFF3E0]' : 'border-[#F0E4D0] bg-[#FFFBF7] hover:border-[#F4A435]/50'}`}
          >
            <div className="text-3xl mb-2">📸</div>
            <div style={{ fontFamily: "'Outfit',sans-serif" }} className="font-bold text-[#5A4A3A] text-sm">{uploading ? 'Uploading…' : 'Click or drag photos here'}</div>
            <div style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs text-[#9A8A7A] mt-1">Up to {canUpload} more · JPG, PNG · Max 8MB each</div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
          </div>
        )}
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {photos.map(ph => (
              <div key={ph.id} className={`relative rounded-xl overflow-hidden border-2 aspect-square bg-[#F5F0EB] ${ph.isPrimary ? 'border-[#F4A435]' : 'border-[#F0E4D0]'}`}>
                <img src={ph.imageUrl} alt="" className="w-full h-full object-cover" />
                {ph.isPrimary && <div className="absolute top-1.5 left-1.5 bg-[#F4A435] text-white text-[10px] font-bold rounded-full px-2 py-0.5">⭐ Main</div>}
                <div className="absolute bottom-0 left-0 right-0 bg-black/55 flex gap-1 p-1.5 justify-center">
                  {!ph.isPrimary && <button onClick={() => setPrimary(ph.id)} className="bg-[#F4A435]/90 text-white text-[10px] font-semibold rounded px-1.5 py-1 cursor-pointer">⭐</button>}
                  <button onClick={() => deletePhoto(ph.id)} className="bg-[#E8735A]/90 text-white text-[10px] font-semibold rounded px-1.5 py-1 cursor-pointer">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: "'Outfit',sans-serif" }} className="text-center text-sm text-[#9A8A7A] py-4">No photos yet — upload your first above</div>
        )}
      </div>
    </div>
  );
}

/** Multi-select pill grid — items are {value, label} from DB; selected stores value strings */
function TagPills({ items, selected, onToggle }: { items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const on = selected.includes(item.value);
        return (
          <button key={item.value} type="button" onClick={() => onToggle(item.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer ${
              on ? 'bg-gradient-to-r from-[#E85AA3] to-[#7B8FE8] text-white border-transparent shadow-sm'
                 : 'bg-white text-[#5A4A3A] border-[#E8D8C8] hover:border-[#E85AA3]/60 hover:text-[#E85AA3]'
            }`}
            style={{ fontFamily: "'Outfit',sans-serif" }}
          >
            {on ? '✓ ' : ''}{item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Read-only tag badge list — resolves value→label from an options array */
function TagBadges({ values, options }: { values?: string[]; options: { value: string; label: string }[] }) {
  if (!values?.length) return <span style={{ fontFamily: "'Outfit',sans-serif" }} className="text-sm text-[#C0B0A0]">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map(v => {
        const label = options.find(o => o.value === v)?.label ?? v;
        return (
          <span key={v} className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#E85AA3]/10 to-[#7B8FE8]/10 text-[#7B5A7A] border border-[#E8D8C8]" style={{ fontFamily: "'Outfit',sans-serif" }}>{label}</span>
        );
      })}
    </div>
  );
}

function InterestsSection({ profile, form, editing, onEdit, onSave, onCancel, saving, setForm, lookup }: {
  profile: Profile | null; form: any; editing: boolean;
  onEdit: () => void; onSave: () => void; onCancel: () => void;
  saving: boolean; setForm: React.Dispatch<React.SetStateAction<any>>;
  lookup: LookupData | null;
}) {
  const toggleArr = (key: string, val: string) =>
    setForm((p: any) => ({ ...p, [key]: (p[key] || []).includes(val) ? (p[key] || []).filter((x: string) => x !== val) : [...(p[key] || []), val] }));

  // Group hobby options by category (data comes from DB)
  const hobbyGroups = (lookup?.hobbyOptions ?? []).reduce<{ category: string; categoryLabel: string; categoryEmoji: string; items: HobbyOption[] }[]>((acc, h) => {
    const g = acc.find(x => x.category === h.category);
    if (g) { g.items.push(h); } else { acc.push({ category: h.category, categoryLabel: h.categoryLabel, categoryEmoji: h.categoryEmoji, items: [h] }); }
    return acc;
  }, []);

  return (
    <Section title="Hobbies & Interests" icon="🎨" editing={editing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} saving={saving}>
      {editing ? (
        <div className="flex flex-col gap-6">
          {/* Hobbies */}
          <div>
            <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>Your Hobbies</div>
            <div className="flex flex-col gap-4">
              {hobbyGroups.map(g => (
                <div key={g.category} className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                  <div className="text-sm font-bold text-[#2A1A1A] mb-2.5" style={{ fontFamily: "'Outfit',sans-serif" }}>{g.categoryEmoji} {g.categoryLabel}</div>
                  <TagPills items={g.items} selected={form.hobbies || []} onToggle={v => toggleArr('hobbies', v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Favourite Music */}
          <div>
            <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>🎵 Favourite Music</div>
            <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
              <TagPills items={lookup?.musicOptions ?? []} selected={form.favMusic || []} onToggle={v => toggleArr('favMusic', v)} />
              <div className="mt-3">
                <input
                  className="w-full border border-[#F0E4D0] rounded-[10px] px-3.5 py-2.5 text-sm text-[#2A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F4A435]/30 focus:border-[#F4A435] transition-colors"
                  placeholder="Other music interests (e.g. Fusion, Blues…)"
                  value={form.favMusicOther || ''}
                  onChange={e => setForm((p: any) => ({ ...p, favMusicOther: e.target.value }))}
                  style={{ fontFamily: "'Outfit',sans-serif" }}
                />
              </div>
            </div>
          </div>

          {/* Sports */}
          <div>
            <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>🏆 Sports You Like</div>
            <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
              <TagPills items={lookup?.sportOptions ?? []} selected={form.favSports || []} onToggle={v => toggleArr('favSports', v)} />
              <div className="mt-3">
                <input
                  className="w-full border border-[#F0E4D0] rounded-[10px] px-3.5 py-2.5 text-sm text-[#2A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F4A435]/30 focus:border-[#F4A435] transition-colors"
                  placeholder="Other sports (e.g. Kabaddi, Martial arts…)"
                  value={form.favSportsOther || ''}
                  onChange={e => setForm((p: any) => ({ ...p, favSportsOther: e.target.value }))}
                  style={{ fontFamily: "'Outfit',sans-serif" }}
                />
              </div>
            </div>
          </div>

          {/* Food */}
          <div>
            <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>🍛 Favourite Food</div>
            <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
              <TagPills items={lookup?.foodOptions ?? []} selected={form.favFood || []} onToggle={v => toggleArr('favFood', v)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {profile && (
            <>
              <div>
                <div className="text-xs font-bold text-[#9A8A7A] uppercase tracking-widest mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>Hobbies</div>
                <TagBadges values={profile.hobbies} options={lookup?.hobbyOptions ?? []} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#9A8A7A] uppercase tracking-widest mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>Favourite Music</div>
                <TagBadges values={profile.favMusic} options={lookup?.musicOptions ?? []} />
                {profile.favMusicOther && <p className="text-xs text-[#7A6A5A] mt-1.5 italic" style={{ fontFamily: "'Outfit',sans-serif" }}>Other: {profile.favMusicOther}</p>}
              </div>
              <div>
                <div className="text-xs font-bold text-[#9A8A7A] uppercase tracking-widest mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>Sports</div>
                <TagBadges values={profile.favSports} options={lookup?.sportOptions ?? []} />
                {profile.favSportsOther && <p className="text-xs text-[#7A6A5A] mt-1.5 italic" style={{ fontFamily: "'Outfit',sans-serif" }}>Other: {profile.favSportsOther}</p>}
              </div>
              <div>
                <div className="text-xs font-bold text-[#9A8A7A] uppercase tracking-widest mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>Favourite Food</div>
                <TagBadges values={profile.favFood} options={lookup?.foodOptions ?? []} />
              </div>
              {!profile.hobbies?.length && !profile.favMusic?.length && !profile.favSports?.length && !profile.favFood?.length && (
                <div className="text-center text-sm text-[#9A8A7A] py-4" style={{ fontFamily: "'Outfit',sans-serif" }}>
                  No hobbies added yet — click Edit to tell matches what you enjoy
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Section>
  );
}

// ─── Input class ──────────────────────────────────────────────────────────────
const inp ="w-full border border-[#F0E4D0] rounded-[10px] px-3.5 py-2.5 text-sm text-[#2A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F4A435]/30 focus:border-[#F4A435] transition-colors";

// ─── Main Page ────────────────────────────────────────────────────────────────
function ProfilePageInner() {
  const searchParams = useSearchParams();
  const activeTab    = searchParams.get('tab') ?? 'basic';
  const { token } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lookup, setLookup] = useState<LookupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [prefForm, setPrefForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const [p, l] = await Promise.all([
      apiGet<{ profile: Profile }>('/api/profiles/me', token).catch(() => null),
      apiGet<LookupData>('/api/profiles/lookup', token).catch(() => null),
    ]);
    if (p?.profile) { setProfile(p.profile); setForm(p.profile); setPrefForm(p.profile.preference || {}); }
    if (l) setLookup(l);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const pf = (k: string) => (v: any) => setPrefForm((p: any) => ({ ...p, [k]: v }));

  function startEdit(s: string) { setForm({ ...profile }); setPrefForm({ ...(profile?.preference || {}) }); setEditing(s); }
  function cancelEdit() { setEditing(null); }

  async function saveSection(s: string) {
    setSaving(true);
    try {
      if (s === 'preferences') await apiPut('/api/profiles/me/preferences', prefForm, token!);
      else await apiPut('/api/profiles/me', form, token!);
      toast.success('Saved successfully');
      setEditing(null);
      load();
    } catch (err: any) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center text-[#9A8A7A]" style={{ fontFamily: "'Outfit',sans-serif" }}>
        <div className="text-4xl mb-3 animate-pulse">💍</div>
        Loading your profile…
      </div>
    </div>
  );

  const allOccs = lookup?.occupationGroups.flatMap(g => g.occupations) ?? [];
  const currencyOptions = buildCurrencyOptions(lookup?.countries ?? []);
  const bodyTypeOptions: BodyTypeOption[] = lookup?.bodyTypes ?? [];
  const toRS = (items: LookupItem[]) => items.map(i => ({ value: i.id, label: i.name }));
  const fromRS = (v: any) => v?.value ?? null;
  const rsVal = (items: LookupItem[], id?: number | null) => id ? { value: id, label: items.find(i => i.id === id)?.name ?? '' } : null;
  const rsStr = (opts: { value: string; label: string }[], v?: string | null) => v ? { value: v, label: opts.find(o => o.value === v)?.label ?? v } : null;
  // Multi-select helpers
  const rsValMulti = (items: LookupItem[], ids?: number[]) => (ids ?? []).map(id => ({ value: id, label: items.find(i => i.id === id)?.name ?? String(id) }));
  const fromRSMulti = (v: any[]) => (v ?? []).map((o: any) => o.value);

  const TAB_META: Record<string, { title: string; icon: string }> = {
    basic:       { title: 'Basic Info',          icon: '👤' },
    physical:    { title: 'Appearance',           icon: '💪' },
    religion:    { title: 'Religion & Language',  icon: '🙏' },
    education:   { title: 'Education & Career',   icon: '🎓' },
    location:    { title: 'Location',             icon: '📍' },
    family:      { title: 'Family Background',    icon: '👨‍👩‍👧' },
    interests:   { title: 'Hobbies & Interests',   icon: '🎨' },
    photos:      { title: 'Edit Photos',          icon: '📷' },
    preferences: { title: 'Partner Preferences',  icon: '💕' },
  };
  const currentTab = TAB_META[activeTab] ?? TAB_META.basic;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{currentTab.icon}</span>
          <h1 style={{ fontFamily: "'Playfair Display',serif" }} className="text-2xl font-extrabold text-[#2A1A1A]">
            {currentTab.title}
          </h1>
        </div>
        {profile && (
          <div style={{ fontFamily: "'Outfit',sans-serif" }} className={`text-xs font-bold uppercase tracking-widest ${profile.status === 'ACTIVE' ? 'text-[#4ABEAA]' : 'text-[#F4A435]'}`}>
            {profile.status}
            {!profile.photos?.length && <span className="text-[#E8735A] ml-3">· Add a photo to activate your profile</span>}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">

        {/* ── Basic Info ─────────────────────────────────────────── */}
        {activeTab === 'basic' && <Section title="Basic Information" icon="👤" editing={editing === 'basic'} onEdit={() => startEdit('basic')} onSave={() => saveSection('basic')} onCancel={cancelEdit} saving={saving}>
          {editing === 'basic' ? (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <F label="First Name *"><input className={inp} value={form.firstName || ''} onChange={e => f('firstName')(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
                <F label="Last Name *"><input className={inp} value={form.lastName || ''} onChange={e => f('lastName')(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
              </div>
              <F label="Date of Birth *"><DateOfBirthPicker value={form.dateOfBirth ? form.dateOfBirth.split('T')[0] : ''} onChange={v => f('dateOfBirth')(v)} /></F>
              <F label="Profile Created By"><RadioPills options={lookup?.profileCreatedBy ?? []} value={form.createdByType} onChange={f('createdByType')} /></F>
              <F label="Marital Status"><RadioPills options={lookup?.maritalStatuses ?? []} value={form.maritalStatus} onChange={f('maritalStatus')} /></F>
              <F label="Eating Habits"><CheckPills options={lookup?.eatingHabits ?? []} value={form.eatingHabits || []} onChange={f('eatingHabits')} /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Smoking"><RadioPills options={lookup?.smokingHabits ?? []} value={form.smokingHabit} onChange={f('smokingHabit')} /></F>
                <F label="Drinking"><RadioPills options={lookup?.drinkingHabits ?? []} value={form.drinkingHabit} onChange={f('drinkingHabit')} /></F>
              </div>
              <F label="About Me">
                <textarea className={inp} rows={4} value={form.aboutMe || ''} onChange={e => f('aboutMe')(e.target.value)} placeholder="Tell potential matches about yourself…" style={{ fontFamily: "'Outfit',sans-serif", resize: 'vertical' }} />
                <p style={{ fontFamily: "'Outfit',sans-serif" }} className={`text-xs mt-1 ${(form.aboutMe?.length || 0) < 50 ? 'text-[#E8735A]' : 'text-[#4ABEAA]'}`}>
                  {form.aboutMe?.length || 0} chars {(form.aboutMe?.length || 0) < 50 ? `(${50 - (form.aboutMe?.length || 0)} more needed)` : '✓'}
                </p>
              </F>
            </div>
          ) : (
            <div>
              <Row l="Full Name" v={profile ? `${profile.firstName} ${profile.lastName}` : null} />
              <Row l="Age" v={profile?.dateOfBirth ? `${calcAge(profile.dateOfBirth)} years old` : null} />
              <Row l="Date of Birth" v={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
              <Row l="Profile Created By" v={labelOf(lookup?.profileCreatedBy ?? [], profile?.createdByType)} />
              <Row l="Marital Status" v={labelOf(lookup?.maritalStatuses ?? [], profile?.maritalStatus)} />
              <Row l="Smoking" v={labelOf(lookup?.smokingHabits ?? [], profile?.smokingHabit)} />
              <Row l="Drinking" v={labelOf(lookup?.drinkingHabits ?? [], profile?.drinkingHabit)} />
              <Row l="Eating Habits" v={profile?.eatingHabits?.map(h => labelOf(lookup?.eatingHabits ?? [], h)).join(', ')} />
              {profile?.aboutMe && <div style={{ fontFamily: "'Outfit',sans-serif" }} className="mt-3 text-sm text-[#5A4A3A] leading-relaxed bg-[#FFFBF7] rounded-xl p-3.5 border border-[#F0E4D0]">{profile.aboutMe}</div>}
            </div>
          )}
        </Section>}

        {/* ── Physical ───────────────────────────────────────────── */}
        {activeTab === 'physical' && <Section title="Physical Appearance" icon="💪" editing={editing === 'physical'} onEdit={() => startEdit('physical')} onSave={() => saveSection('physical')} onCancel={cancelEdit} saving={saving}>
          {editing === 'physical' ? (
            <div>
              <F label="Height"><HeightPicker value={Number(form.height) || 165} onChange={v => f('height')(v)} /></F>
              <F label="Weight (kg)">
                <div className="flex items-center gap-3">
                  <input type="number" min={30} max={200} className={inp} value={form.weight || ''} onChange={e => f('weight')(e.target.value)} placeholder="e.g. 60" style={{ fontFamily: "'Outfit',sans-serif", maxWidth: 140 }} />
                  <span style={{ fontFamily: "'Outfit',sans-serif" }} className="text-sm text-[#9A8A7A]">kg</span>
                </div>
              </F>
              <F label="Body Type"><BodyTypePicker value={form.bodyType} onChange={f('bodyType')} options={bodyTypeOptions} /></F>
              <F label="Physical Status"><RadioPills options={lookup?.physicalStatuses ?? []} value={form.physicalStatus} onChange={f('physicalStatus')} /></F>
              <F label="Blood Group">
                <select className={inp} value={form.bloodGroup || ''} onChange={e => f('bloodGroup')(e.target.value || null)} style={{ fontFamily: "'Outfit',sans-serif" }}>
                  <option value="">— Select —</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </F>
            </div>
          ) : (
            <div>
              <Row l="Height" v={profile?.height ? `${profile.height} cm  ·  ${toFtIn(profile.height)}` : null} />
              <Row l="Weight" v={profile?.weight ? `${profile.weight} kg` : null} />
              <Row l="Body Type" v={profile?.bodyType ? (() => { const bt = lookup?.bodyTypes?.find(b => b.value === profile.bodyType); return bt ? `${bt.label} — ${bt.description}` : profile.bodyType; })() : null} />
              <Row l="Physical Status" v={labelOf(lookup?.physicalStatuses ?? [], profile?.physicalStatus)} />
              <Row l="Blood Group" v={profile?.bloodGroup ?? null} />
            </div>
          )}
        </Section>}

        {/* ── Religion & Language ────────────────────────────────── */}
        {activeTab === 'religion' && <Section title="Religion & Language" icon="🙏" editing={editing === 'religion'} onEdit={() => startEdit('religion')} onSave={() => saveSection('religion')} onCancel={cancelEdit} saving={saving}>
          {editing === 'religion' ? (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Religion">
                  <Select options={toRS(lookup?.religions ?? [])} value={rsVal(lookup?.religions ?? [], form.religionId)} onChange={v => f('religionId')(fromRS(v))} styles={rsStyles} placeholder="Search religion…" isClearable />
                </F>
                <F label="Denomination (optional)">
                  <input className={inp} value={form.denomination || ''} onChange={e => f('denomination')(e.target.value)} placeholder="e.g. Roman Catholic, Theravada" style={{ fontFamily: "'Outfit',sans-serif" }} />
                </F>
              </div>
              <F label="Mother Tongue">
                {lookup?.motherTongues && <RadioList items={lookup.motherTongues} value={form.motherTongueId ? Number(form.motherTongueId) : null} onChange={v => f('motherTongueId')(Number(v))} />}
              </F>
            </div>
          ) : (
            <div>
              <Row l="Religion" v={profile?.religion?.name} />
              <Row l="Denomination" v={profile?.denomination} />
              <Row l="Mother Tongue" v={profile?.motherTongue?.name} />
            </div>
          )}
        </Section>}

        {/* ── Education & Career ─────────────────────────────────── */}
        {activeTab === 'education' && <Section title="Education & Career" icon="🎓" editing={editing === 'education'} onEdit={() => startEdit('education')} onSave={() => saveSection('education')} onCancel={cancelEdit} saving={saving}>
          {editing === 'education' ? (
            <div>
              <F label="Highest Education">
                {lookup?.educations && <RadioList items={lookup.educations} value={form.highestEducationId ? Number(form.highestEducationId) : null} onChange={v => f('highestEducationId')(Number(v))} />}
              </F>
              <F label="Employment Status"><RadioPills options={lookup?.employmentStatuses ?? []} value={form.employmentStatus} onChange={f('employmentStatus')} /></F>
              <F label="Occupation">
                <Select options={toRS(allOccs)} value={rsVal(allOccs, form.occupationId)} onChange={v => f('occupationId')(fromRS(v))} styles={rsStyles} placeholder="Search occupation…" isClearable />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Annual Income">
                  <input type="number" className={inp} value={form.annualIncome || ''} onChange={e => f('annualIncome')(e.target.value)} placeholder="e.g. 1200000" style={{ fontFamily: "'Outfit',sans-serif" }} />
                </F>
                <F label="Currency">
                  <Select options={currencyOptions} value={rsStr(currencyOptions, form.currency)} onChange={v => f('currency')(v?.value ?? null)} styles={rsStyles} placeholder="Search currency…" isClearable />
                </F>
              </div>
            </div>
          ) : (
            <div>
              <Row l="Education" v={profile?.highestEducation?.name} />
              <Row l="Employment" v={labelOf(lookup?.employmentStatuses ?? [], profile?.employmentStatus)} />
              <Row l="Occupation" v={profile?.occupation?.name} />
              <Row l="Annual Income" v={profile?.annualIncome ? `${profile.currency || ''} ${profile.annualIncome.toLocaleString()}`.trim() : null} />
            </div>
          )}
        </Section>}

        {/* ── Location ──────────────────────────────────────────── */}
        {activeTab === 'location' && <Section title="Location" icon="📍" editing={editing === 'location'} onEdit={() => startEdit('location')} onSave={() => saveSection('location')} onCancel={cancelEdit} saving={saving}>
          {editing === 'location' ? (
            <div>
              <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-wide mb-3">🏠 Native Country</p>
              <F label="Country">
                <Select options={toRS(lookup?.countries ?? [])} value={rsVal(lookup?.countries ?? [], form.nativeCountryId)} onChange={v => f('nativeCountryId')(fromRS(v))} styles={rsStyles} placeholder="Search country…" isClearable />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="State / Province"><input className={inp} value={form.nativeCountryState || ''} onChange={e => f('nativeCountryState')(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
                <F label="City"><input className={inp} value={form.nativeCountryCity || ''} onChange={e => f('nativeCountryCity')(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
              </div>
              <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-wide mb-3 mt-4">🌍 Currently Living In</p>
              <F label="Country">
                <Select options={toRS(lookup?.countries ?? [])} value={rsVal(lookup?.countries ?? [], form.countryLivingId)} onChange={v => f('countryLivingId')(fromRS(v))} styles={rsStyles} placeholder="Search country…" isClearable />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="State / Province"><input className={inp} value={form.countryLivingState || ''} onChange={e => f('countryLivingState')(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
                <F label="City"><input className={inp} value={form.countryLivingCity || ''} onChange={e => f('countryLivingCity')(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
              </div>
              <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-wide mb-3 mt-4">🛂 Citizenship</p>
              <F label="Country">
                <Select options={toRS(lookup?.countries ?? [])} value={rsVal(lookup?.countries ?? [], form.citizenshipId)} onChange={v => f('citizenshipId')(fromRS(v))} styles={rsStyles} placeholder="Search country…" isClearable />
              </F>
              <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-wide mb-3 mt-4">🌱 Grew Up In</p>
              <F label="Countries (select all that apply)">
                <Select
                  isMulti
                  options={toRS(lookup?.countries ?? [])}
                  value={(form.grewUpInCountryIds ?? []).map((id: number) => {
                    const c = lookup?.countries.find(c => c.id === id);
                    return c ? { value: c.id, label: c.name } : null;
                  }).filter(Boolean)}
                  onChange={(vals: any) => f('grewUpInCountryIds')((vals ?? []).map((v: any) => v.value))}
                  styles={rsStyles}
                  placeholder="Search countries…"
                />
              </F>
            </div>
          ) : (
            <div>
              <Row l="Native" v={[profile?.nativeCountry?.name, profile?.nativeCountryState, profile?.nativeCountryCity].filter(Boolean).join(', ')} />
              <Row l="Currently In" v={[profile?.countryLiving?.name, profile?.countryLivingState, profile?.countryLivingCity].filter(Boolean).join(', ')} />
              <Row l="Citizenship" v={profile?.citizenship?.name} />
              <Row l="Grew Up In" v={(profile?.grewUpInCountryIds ?? []).length > 0 ? (profile!.grewUpInCountryIds!.map(id => lookup?.countries.find(c => c.id === id)?.name).filter(Boolean).join(', ') || null) : null} />
            </div>
          )}
        </Section>}

        {/* ── Family ────────────────────────────────────────────── */}
        {activeTab === 'family' && <Section title="Family Background" icon="👨‍👩‍👧‍👦" editing={editing === 'family'} onEdit={() => startEdit('family')} onSave={() => saveSection('family')} onCancel={cancelEdit} saving={saving}>
          {editing === 'family' ? (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Father's Name"><input className={inp} value={form.fatherName || ''} onChange={e => f('fatherName')(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
                <F label="Father's Occupation">
                  <Select options={toRS(allOccs)} value={rsVal(allOccs, form.fatherOccupationId)} onChange={v => f('fatherOccupationId')(fromRS(v))} styles={rsStyles} placeholder="Search…" isClearable />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Mother's Name"><input className={inp} value={form.motherName || ''} onChange={e => f('motherName')(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
                <F label="Mother's Occupation">
                  <Select options={toRS(allOccs)} value={rsVal(allOccs, form.motherOccupationId)} onChange={v => f('motherOccupationId')(fromRS(v))} styles={rsStyles} placeholder="Search…" isClearable />
                </F>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[{ l: 'Brothers', k: 'noOfBrothers' }, { l: 'Married', k: 'brothersMarried' }, { l: 'Sisters', k: 'noOfSisters' }, { l: 'Married', k: 'sistersMarried' }].map(({ l, k }) => (
                  <F key={k} label={l}><input type="number" min={0} max={20} className={inp} value={form[k] ?? ''} onChange={e => f(k)(e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
                ))}
              </div>
              <F label="About Family">
                <textarea className={inp} rows={3} value={form.aboutFamily || ''} onChange={e => f('aboutFamily')(e.target.value)} placeholder="Describe your family background…" style={{ fontFamily: "'Outfit',sans-serif", resize: 'vertical' }} />
              </F>
            </div>
          ) : (
            <div>
              <Row l="Father" v={[profile?.fatherName, profile?.fatherOccupation?.name].filter(Boolean).join(' · ')} />
              <Row l="Mother" v={[profile?.motherName, profile?.motherOccupation?.name].filter(Boolean).join(' · ')} />
              <Row l="Brothers" v={profile?.noOfBrothers != null ? `${profile.noOfBrothers} (${profile.brothersMarried ?? 0} married)` : null} />
              <Row l="Sisters" v={profile?.noOfSisters != null ? `${profile.noOfSisters} (${profile.sistersMarried ?? 0} married)` : null} />
              {profile?.aboutFamily && <div style={{ fontFamily: "'Outfit',sans-serif" }} className="mt-3 text-sm text-[#5A4A3A] leading-relaxed bg-[#FFFBF7] rounded-xl p-3.5 border border-[#F0E4D0]">{profile.aboutFamily}</div>}
            </div>
          )}
        </Section>}

        {/* ── Hobbies & Interests ────────────────────────────────── */}
        {activeTab === 'interests' && (
          <InterestsSection
            profile={profile}
            form={form}
            editing={editing === 'interests'}
            onEdit={() => startEdit('interests')}
            onSave={() => saveSection('interests')}
            onCancel={cancelEdit}
            saving={saving}
            setForm={setForm}
            lookup={lookup}
          />
        )}

        {/* ── Photos ────────────────────────────────────────────── */}
        {activeTab === 'photos' && profile && <PhotoSection profile={profile} token={token} onRefresh={load} />}

        {/* ── Partner Preferences ───────────────────────────────── */}
        {activeTab === 'preferences' && <Section title="Partner Preferences" icon="💫" editing={editing === 'preferences'} onEdit={() => startEdit('preferences')} onSave={() => saveSection('preferences')} onCancel={cancelEdit} saving={saving}>
          {editing === 'preferences' ? (
            <div className="flex flex-col gap-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs text-amber-800">💡 These help us find better matches. Profiles close to your preferences are shown first. Leave any field blank to mean "open to any".</p>
              </div>

              {/* Age & Height */}
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3">📏 Age & Height</p>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Age Range (years)">
                    <div className="flex items-center gap-2">
                      <input type="number" min={18} max={80} className={inp} value={prefForm.minAge || ''} onChange={e => pf('minAge')(e.target.value)} placeholder="Min" style={{ fontFamily: "'Outfit',sans-serif" }} />
                      <span className="text-[#9A8A7A] font-bold">–</span>
                      <input type="number" min={18} max={80} className={inp} value={prefForm.maxAge || ''} onChange={e => pf('maxAge')(e.target.value)} placeholder="Max" style={{ fontFamily: "'Outfit',sans-serif" }} />
                    </div>
                  </F>
                  <F label="Height Range (cm)">
                    <div className="flex items-center gap-2">
                      <input type="number" min={100} max={250} className={inp} value={prefForm.minHeight || ''} onChange={e => pf('minHeight')(e.target.value)} placeholder="Min" style={{ fontFamily: "'Outfit',sans-serif" }} />
                      <span className="text-[#9A8A7A] font-bold">–</span>
                      <input type="number" min={100} max={250} className={inp} value={prefForm.maxHeight || ''} onChange={e => pf('maxHeight')(e.target.value)} placeholder="Max" style={{ fontFamily: "'Outfit',sans-serif" }} />
                    </div>
                  </F>
                </div>
              </div>

              {/* Marital & Physical */}
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3">💍 Marital & Physical</p>
                <F label="Acceptable Marital Status (select all that apply)">
                  <CheckPills options={lookup?.maritalStatuses ?? []} value={prefForm.maritalStatus || []} onChange={pf('maritalStatus')} />
                </F>
                <F label="Physical Status (select all that apply)">
                  <CheckPills options={lookup?.physicalStatuses ?? []} value={prefForm.physicalStatus || []} onChange={pf('physicalStatus')} />
                </F>
              </div>

              {/* Religion & Language */}
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3">🙏 Religion & Language</p>
                <F label="Religion (select all acceptable)">
                  <Select isMulti options={toRS(lookup?.religions ?? [])} value={rsValMulti(lookup?.religions ?? [], prefForm.religionIds)} onChange={v => pf('religionIds')(fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any religion…" closeMenuOnSelect={false} />
                </F>
                <F label="Mother Tongue (select all acceptable)">
                  <Select isMulti options={toRS(lookup?.motherTongues ?? [])} value={rsValMulti(lookup?.motherTongues ?? [], prefForm.motherTongueIds)} onChange={v => pf('motherTongueIds')(fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any language…" closeMenuOnSelect={false} />
                </F>
              </div>

              {/* Education & Career */}
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3">🎓 Education & Career</p>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Minimum Education">
                    <Select options={toRS(lookup?.educations ?? [])} value={rsVal(lookup?.educations ?? [], prefForm.educationId)} onChange={v => pf('educationId')(fromRS(v))} styles={rsStyles} placeholder="Any education" isClearable />
                  </F>
                  <F label="Occupation">
                    <input className={inp} value={prefForm.occupation || ''} onChange={e => pf('occupation')(e.target.value)} placeholder="e.g. Doctor, Engineer, Teacher…" style={{ fontFamily: "'Outfit',sans-serif" }} />
                  </F>
                </div>
                <F label="Annual Income Range">
                  <div className="flex items-center gap-3">
                    <input type="number" min={0} className={inp} value={prefForm.annualIncomeMin || ''} onChange={e => pf('annualIncomeMin')(e.target.value)} placeholder="Min income" style={{ fontFamily: "'Outfit',sans-serif" }} />
                    <span className="text-[#9A8A7A] font-bold">–</span>
                    <input type="number" min={0} className={inp} value={prefForm.annualIncomeMax || ''} onChange={e => pf('annualIncomeMax')(e.target.value)} placeholder="Max income" style={{ fontFamily: "'Outfit',sans-serif" }} />
                  </div>
                </F>
              </div>

              {/* Location */}
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3">📍 Location</p>
                <F label="Citizenship (select all acceptable)">
                  <Select isMulti options={toRS(lookup?.countries ?? [])} value={rsValMulti(lookup?.countries ?? [], prefForm.citizenshipIds)} onChange={v => pf('citizenshipIds')(fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any citizenship…" closeMenuOnSelect={false} />
                </F>
                <F label="Currently Living In (select all acceptable)">
                  <Select isMulti options={toRS(lookup?.countries ?? [])} value={rsValMulti(lookup?.countries ?? [], prefForm.countryLivingIds)} onChange={v => pf('countryLivingIds')(fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any country…" closeMenuOnSelect={false} />
                </F>
              </div>

              {/* Lifestyle */}
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <p style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3">🌿 Lifestyle</p>
                <F label="Eating Habits (select all acceptable)">
                  <CheckPills options={lookup?.eatingHabits ?? []} value={prefForm.eatingHabits || []} onChange={pf('eatingHabits')} />
                </F>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Smoking"><RadioPills options={[{ value: '', label: 'Any' }, ...(lookup?.smokingHabits ?? [])]} value={prefForm.smokingHabit ?? ''} onChange={v => pf('smokingHabit')(v || null)} /></F>
                  <F label="Drinking"><RadioPills options={[{ value: '', label: 'Any' }, ...(lookup?.drinkingHabits ?? [])]} value={prefForm.drinkingHabit ?? ''} onChange={v => pf('drinkingHabit')(v || null)} /></F>
                </div>
              </div>

              {/* About Partner */}
              <F label="About Your Ideal Partner">
                <textarea className={inp} rows={4} value={prefForm.aboutPartner || ''} onChange={e => pf('aboutPartner')(e.target.value)} placeholder="Describe the qualities you're looking for in your life partner…" style={{ fontFamily: "'Outfit',sans-serif", resize: 'vertical' }} />
              </F>
            </div>
          ) : (
            <div>
              {profile?.preference ? (
                <>
                  <Row l="Age Range" v={profile.preference.minAge && profile.preference.maxAge ? `${profile.preference.minAge} – ${profile.preference.maxAge} years` : null} />
                  <Row l="Height Range" v={profile.preference.minHeight && profile.preference.maxHeight ? `${profile.preference.minHeight} – ${profile.preference.maxHeight} cm` : null} />
                  <Row l="Marital Status" v={profile.preference.maritalStatus?.map((v: string) => labelOf(lookup?.maritalStatuses ?? [], v)).join(', ')} />
                  <Row l="Physical Status" v={profile.preference.physicalStatus?.map((v: string) => labelOf(lookup?.physicalStatuses ?? [], v)).join(', ')} />
                  <Row l="Religion" v={(profile.preference.religionIds ?? []).map((id: number) => lookup?.religions.find(r => r.id === id)?.name).filter(Boolean).join(', ')} />
                  <Row l="Mother Tongue" v={(profile.preference.motherTongueIds ?? []).map((id: number) => lookup?.motherTongues.find(m => m.id === id)?.name).filter(Boolean).join(', ')} />
                  <Row l="Min Education" v={lookup?.educations.find(e => e.id === profile.preference.educationId)?.name} />
                  <Row l="Occupation" v={profile.preference.occupation} />
                  <Row l="Income Range" v={profile.preference.annualIncomeMin || profile.preference.annualIncomeMax ? `${profile.preference.annualIncomeMin?.toLocaleString() ?? '0'} – ${profile.preference.annualIncomeMax?.toLocaleString() ?? '∞'}` : null} />
                  <Row l="Citizenship" v={(profile.preference.citizenshipIds ?? []).map((id: number) => lookup?.countries.find(c => c.id === id)?.name).filter(Boolean).join(', ')} />
                  <Row l="Living In" v={(profile.preference.countryLivingIds ?? []).map((id: number) => lookup?.countries.find(c => c.id === id)?.name).filter(Boolean).join(', ')} />
                  <Row l="Eating Habits" v={profile.preference.eatingHabits?.map((v: string) => labelOf(lookup?.eatingHabits ?? [], v)).join(', ')} />
                  <Row l="Smoking" v={labelOf(lookup?.smokingHabits ?? [], profile.preference.smokingHabit)} />
                  <Row l="Drinking" v={labelOf(lookup?.drinkingHabits ?? [], profile.preference.drinkingHabit)} />
                  {profile.preference.aboutPartner && <div style={{ fontFamily: "'Outfit',sans-serif" }} className="mt-3 text-sm text-[#5A4A3A] leading-relaxed bg-[#FFFBF7] rounded-xl p-3.5 border border-[#F0E4D0]">{profile.preference.aboutPartner}</div>}
                </>
              ) : (
                <div style={{ fontFamily: "'Outfit',sans-serif" }} className="text-center text-sm text-[#9A8A7A] py-4">
                  No preferences set yet — click Edit to add your partner preferences
                </div>
              )}
            </div>
          )}
        </Section>}

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  );
}
