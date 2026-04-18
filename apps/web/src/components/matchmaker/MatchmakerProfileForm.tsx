'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Select from 'react-select';
import DateOfBirthPicker from '@/components/shared/DateOfBirthPicker';
import { buildCurrencyOptions } from '@/lib/profile-constants';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LookupItem { id: number; name: string }
interface OccupationGroup { id: number; name: string; occupations: LookupItem[] }
interface CountryItem { id: number; name: string; currency?: string | null }
interface BodyTypeItem { id: number; value: string; label: string; description: string; svgContent?: string | null }
interface LookupOption { id: number; value: string; label: string; icon?: string | null }
interface HobbyOption { id: number; value: string; label: string; category: string; categoryLabel: string; categoryEmoji: string; sortOrder: number }
interface LookupData {
  countries: CountryItem[]; religions: LookupItem[]; motherTongues: LookupItem[];
  educations: LookupItem[]; occupationGroups: OccupationGroup[];
  bodyTypes: BodyTypeItem[];
  maritalStatuses: LookupOption[]; genders: LookupOption[]; physicalStatuses: LookupOption[];
  smokingHabits: LookupOption[]; drinkingHabits: LookupOption[]; eatingHabits: LookupOption[];
  employmentStatuses: LookupOption[];
  hobbyOptions: HobbyOption[]; musicOptions: LookupOption[]; sportOptions: LookupOption[]; foodOptions: LookupOption[];
}

interface FormState {
  firstName: string; lastName: string; gender: string; dateOfBirth: string;
  maritalStatus: string; height: string; weight: string; bodyType: string;
  physicalStatus: string; bloodGroup: string; aboutMe: string;
  religionId: string; denomination: string; motherTongueId: string;
  eatingHabits: string[]; smokingHabit: string; drinkingHabit: string;
  nativeCountryId: string; nativeCountryState: string; nativeCountryCity: string;
  countryLivingId: string; countryLivingState: string; countryLivingCity: string;
  citizenshipId: string; grewUpInCountryIds: number[];
  highestEducationId: string; employmentStatus: string; occupationId: string;
  annualIncome: string; currency: string;
  fatherName: string; fatherOccupationId: string; motherName: string; motherOccupationId: string;
  noOfBrothers: string; brothersMarried: string; noOfSisters: string; sistersMarried: string; aboutFamily: string;
  profileVisibility: string; showPhoto: boolean; showFullAge: boolean; showFirstName: boolean;
  horoscopeAvailable: boolean; contactMethods: string[]; contactWhatsapp: string; contactPhone: string; contactEmail: string;
  hobbies: string[]; favMusic: string[]; favMusicOther: string; favSports: string[]; favSportsOther: string; favFood: string[];
  prefMinAge: string; prefMaxAge: string; prefMinHeight: string; prefMaxHeight: string;
  prefReligionIds: number[]; prefMotherTongueIds: number[]; prefCitizenshipIds: number[]; prefCountryLivingIds: number[];
  prefGrewUpInCountryIds: number[];
  prefMaritalStatuses: string[]; prefPhysicalStatuses: string[]; prefEatingHabits: string[];
  prefSmokingHabit: string; prefDrinkingHabit: string; prefEducationId: string;
  prefOccupationId: string; prefMinIncome: string; prefMaxIncome: string; prefAboutPartner: string;
}

const EMPTY: FormState = {
  firstName: '', lastName: '', gender: '', dateOfBirth: '', maritalStatus: '',
  height: '', weight: '', bodyType: '', physicalStatus: 'NORMAL', bloodGroup: '', aboutMe: '',
  religionId: '', denomination: '', motherTongueId: '',
  eatingHabits: [], smokingHabit: '', drinkingHabit: '',
  nativeCountryId: '', nativeCountryState: '', nativeCountryCity: '',
  countryLivingId: '', countryLivingState: '', countryLivingCity: '', citizenshipId: '', grewUpInCountryIds: [],
  highestEducationId: '', employmentStatus: '', occupationId: '', annualIncome: '', currency: 'LKR',
  fatherName: '', fatherOccupationId: '', motherName: '', motherOccupationId: '',
  noOfBrothers: '', brothersMarried: '', noOfSisters: '', sistersMarried: '', aboutFamily: '',
  profileVisibility: 'ACTIVE', showPhoto: false, showFullAge: false, showFirstName: false,
  horoscopeAvailable: false, contactMethods: [], contactWhatsapp: '', contactPhone: '', contactEmail: '',
  hobbies: [], favMusic: [], favMusicOther: '', favSports: [], favSportsOther: '', favFood: [],
  prefMinAge: '', prefMaxAge: '', prefMinHeight: '', prefMaxHeight: '',
  prefReligionIds: [], prefMotherTongueIds: [], prefCitizenshipIds: [], prefCountryLivingIds: [],
  prefGrewUpInCountryIds: [],
  prefMaritalStatuses: [], prefPhysicalStatuses: [], prefEatingHabits: [],
  prefSmokingHabit: '', prefDrinkingHabit: '', prefEducationId: '',
  prefOccupationId: '', prefMinIncome: '', prefMaxIncome: '', prefAboutPartner: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toFtIn(cm: number) { const i = Math.round(cm / 2.54); return `${Math.floor(i / 12)}' ${i % 12}"`; }

const rsStyles = {
  control: (b: any, s: any) => ({ ...b, borderColor: s.isFocused ? '#F4A435' : '#F0E4D0', borderRadius: 10, boxShadow: s.isFocused ? '0 0 0 2px rgba(244,164,53,0.2)' : 'none', fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', minHeight: 42 }),
  option: (b: any, s: any) => ({ ...b, background: s.isSelected ? '#F4A435' : s.isFocused ? '#FFF3E0' : 'white', color: s.isSelected ? 'white' : '#2A1A1A', fontFamily: "'Outfit',sans-serif", fontSize: '0.86rem' }),
  singleValue: (b: any) => ({ ...b, fontFamily: "'Outfit',sans-serif", color: '#2A1A1A' }),
  placeholder: (b: any) => ({ ...b, color: '#C0B0A0', fontFamily: "'Outfit',sans-serif" }),
  menu: (b: any) => ({ ...b, borderRadius: 12, border: '1px solid #F0E4D0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 50 }),
  multiValue: (b: any) => ({ ...b, background: '#FFF3E0', borderRadius: 20 }),
  multiValueLabel: (b: any) => ({ ...b, color: '#E8735A', fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem' }),
};

const inp = "w-full border border-[#F0E4D0] rounded-[10px] px-3.5 py-2.5 text-sm text-[#2A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F4A435]/30 focus:border-[#F4A435] transition-colors";

// ─── UI Components ────────────────────────────────────────────────────────────

function F({ label, error, children, id }: { label: string; error?: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="mb-4" id={id}>
      <label style={{ fontFamily: "'Outfit',sans-serif" }} className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${error ? 'text-[#E8735A]' : 'text-[#5A4A3A]'}`}>{label}</label>
      {children}
      {error && <p className="text-xs text-[#E8735A] mt-1" style={{ fontFamily: "'Outfit',sans-serif" }}>{error}</p>}
    </div>
  );
}

function RadioPills({ options, value, onChange }: { options: { value: string; label: string }[]; value?: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${value === opt.value ? 'bg-gradient-to-r from-[#F4A435] to-[#E8735A] text-white border-transparent shadow-sm' : 'bg-white text-[#5A4A3A] border-[#E8D8C8] hover:border-[#F4A435] hover:text-[#E8735A]'}`}
          style={{ fontFamily: "'Outfit',sans-serif" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckPills({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const on = value.includes(opt.value);
        return (
          <button key={opt.value} type="button" onClick={() => onChange(on ? value.filter(x => x !== opt.value) : [...value, opt.value])}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${on ? 'bg-gradient-to-r from-[#F4A435] to-[#E8735A] text-white border-transparent shadow-sm' : 'bg-white text-[#5A4A3A] border-[#E8D8C8] hover:border-[#F4A435]'}`}
            style={{ fontFamily: "'Outfit',sans-serif" }}>
            {on ? '✓ ' : ''}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TagPills({ items, selected, onToggle }: { items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const on = selected.includes(item.value);
        return (
          <button key={item.value} type="button" onClick={() => onToggle(item.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${on ? 'bg-gradient-to-r from-[#E85AA3] to-[#7B8FE8] text-white border-transparent shadow-sm' : 'bg-white text-[#5A4A3A] border-[#E8D8C8] hover:border-[#E85AA3]/60'}`}
            style={{ fontFamily: "'Outfit',sans-serif" }}>
            {on ? '✓ ' : ''}{item.label}
          </button>
        );
      })}
    </div>
  );
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const HEIGHT_MIN = 122; // 4 feet exactly

function HeightPicker({ value = 165, onChange }: { value?: number; onChange: (v: number) => void }) {
  const MIN = HEIGHT_MIN, MAX = 215;
  const pct = (value - MIN) / (MAX - MIN);
  const ticks = Array.from({ length: Math.floor((MAX - MIN) / 5) + 1 }, (_, i) => MIN + i * 5);
  return (
    <div className="flex items-center gap-6 p-5 bg-[#FFFBF7] rounded-2xl border border-[#F0E4D0]">
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
        <div className="absolute left-0 right-0 transition-all duration-100" style={{ top: `${(1 - pct) * 218 + 11}px`, height: 3, background: '#F4A435', boxShadow: '0 0 8px rgba(244,164,53,0.6)', borderRadius: 2 }}>
          <div style={{ position: 'absolute', right: -1, top: -3, width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: '7px solid #F4A435' }} />
        </div>
      </div>
      <div className="flex-1">
        <div style={{ fontFamily: "'Outfit',sans-serif" }} className="mb-1">
          <span className="text-5xl font-bold text-[#2A1A1A]">{value}</span>
          <span className="text-base text-[#9A8A7A] ml-1.5">cm</span>
        </div>
        <div className="text-2xl text-[#7A6A5A] mb-5" style={{ fontFamily: "'Outfit',sans-serif" }}>{toFtIn(value)}</div>
        <input type="range" min={MIN} max={MAX} value={value} onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: '#F4A435', background: `linear-gradient(to right, #F4A435 ${pct * 100}%, #F0E4D0 ${pct * 100}%)` }} />
        <div className="flex justify-between text-xs text-[#9A8A7A] mt-2" style={{ fontFamily: "'Outfit',sans-serif" }}>
          <span>4'0" (122cm)</span><span>7'0" (215cm)</span>
        </div>
      </div>
    </div>
  );
}

function BodyTypePicker({ value, onChange, options }: { value?: string | null; onChange: (v: string) => void; options: { value: string; label: string; description: string; svgContent?: string | null }[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {options.map(bt => (
        <button key={bt.value} type="button" onClick={() => onChange(bt.value)}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer ${value === bt.value ? 'border-[#F4A435] bg-[#FFF3E0] shadow-sm' : 'border-[#F0E4D0] bg-white hover:border-[#F4A435]/50'}`}>
          {bt.svgContent && (
            <div className={`transition-colors ${value === bt.value ? 'text-[#F4A435]' : 'text-[#C0B0A0]'}`}>
              <svg viewBox="0 0 28 56" fill="currentColor" style={{ width: 24, height: 48, display: 'block', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: bt.svgContent }} />
            </div>
          )}
          <span style={{ fontFamily: "'Outfit',sans-serif" }} className={`text-xs font-bold ${value === bt.value ? 'text-[#E8735A]' : 'text-[#7A6A5A]'}`}>{bt.label}</span>
          <span style={{ fontFamily: "'Outfit',sans-serif" }} className="text-[10px] text-[#9A8A7A] text-center leading-tight">{bt.description}</span>
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] mb-2">
      <span style={{ fontFamily: "'Outfit',sans-serif" }} className="text-sm text-[#2A1A1A] font-medium">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        style={{ width: 48, height: 26, borderRadius: 13, background: checked ? 'linear-gradient(135deg,#F4A435,#E8735A)' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
      </button>
    </div>
  );
}

// ─── Modal Dialog ─────────────────────────────────────────────────────────────

interface ModalState { type: 'success' | 'error'; title: string; msg: string }

function SaveModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  const isSuccess = modal.type === 'success';

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        style={{ border: `1.5px solid ${isSuccess ? '#A7F3D0' : '#FECACA'}` }}
        role="dialog"
        aria-modal="true"
      >
        {/* Top accent bar */}
        <div
          className="h-1.5 rounded-t-2xl"
          style={{ background: isSuccess ? 'linear-gradient(90deg,#4ABEAA,#34D399)' : 'linear-gradient(90deg,#E8735A,#F87171)' }}
        />

        <div className="px-7 pt-7 pb-6">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 64, height: 64,
                background: isSuccess ? '#D1FAE5' : '#FEE2E2',
                fontSize: 30,
              }}
            >
              {isSuccess ? '✅' : '⚠️'}
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-center text-xl font-extrabold text-[#2A1A1A] mb-2"
            style={{ fontFamily: "'Playfair Display',serif" }}
          >
            {modal.title}
          </h3>

          {/* Message */}
          <p
            className="text-center text-sm text-[#7A6A5A] mb-6 leading-relaxed"
            style={{ fontFamily: "'Outfit',sans-serif" }}
          >
            {modal.msg}
          </p>

          {/* Action */}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full py-3 text-sm font-bold text-white transition-shadow hover:shadow-lg cursor-pointer"
            style={{
              fontFamily: "'Outfit',sans-serif",
              background: isSuccess
                ? 'linear-gradient(135deg,#4ABEAA,#34D399)'
                : 'linear-gradient(135deg,#E8735A,#F87171)',
            }}
          >
            {isSuccess ? 'Great, continue editing' : 'OK, try again'}
          </button>
        </div>

        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9A8A7A] hover:text-[#5A4A3A] cursor-pointer bg-transparent border-none text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}

// ─── Accordion Section ────────────────────────────────────────────────────────

function Section({
  title, icon, color = '#F4A435', alwaysOpen = false, isOpen, onToggle,
  onSave, saving, saveDisabled, saveDisabledMsg, children,
}: {
  title: string; icon: string; color?: string; alwaysOpen?: boolean;
  isOpen: boolean; onToggle: () => void;
  onSave: () => void; saving: boolean; saveDisabled?: boolean; saveDisabledMsg?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#F0E4D0] shadow-sm overflow-hidden">
      {/* Header */}
      <div
        onClick={alwaysOpen ? undefined : onToggle}
        className={`flex items-center justify-between px-6 py-4 border-b border-[#F0E4D0] ${!alwaysOpen ? 'cursor-pointer hover:bg-[#FFFBF7] transition-colors' : ''}`}
        style={{ background: isOpen ? '#FFFBF7' : 'white' }}
      >
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
          <span style={{ fontFamily: "'Playfair Display',serif" }} className="font-bold text-[#2A1A1A] text-base">{title}</span>
        </div>
        {!alwaysOpen && (
          <span style={{ fontSize: 18, color: '#9A8A7A', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌄</span>
        )}
      </div>

      {/* Body */}
      {isOpen && (
        <>
          <div className="px-6 py-5">{children}</div>
          {/* Save footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0E4D0] bg-[#FFFBF7]">
            {saveDisabled && saveDisabledMsg
              ? <span style={{ fontFamily: "'Outfit',sans-serif" }} className="text-xs text-[#9A8A7A]">⚠ {saveDisabledMsg}</span>
              : <span />
            }
            <button
              type="button"
              onClick={onSave}
              disabled={saving || saveDisabled}
              style={{ fontFamily: "'Outfit',sans-serif" }}
              className="bg-gradient-to-r from-[#F4A435] to-[#E8735A] text-white rounded-full px-6 py-2.5 text-sm font-bold disabled:opacity-50 cursor-pointer hover:shadow-md transition-shadow"
            >
              {saving ? '⏳ Saving…' : '💾 Save'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props { profileId?: number; prefillGender?: string }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MatchmakerProfileForm({ profileId, prefillGender }: Props) {
  const { token } = useAuthStore();
  const router = useRouter();
  const isEdit = !!profileId;

  const [form, setForm] = useState<FormState>({ ...EMPTY, gender: prefillGender ?? '' });
  const [lookup, setLookup] = useState<LookupData | null>(null);
  const [savedId, setSavedId] = useState<number | null>(profileId ?? null);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalState | null>(null);

  // Photos
  const [photos, setPhotos] = useState<{ id: number; imageUrl: string; isPrimary: boolean }[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Accordion open state (first 3 always open)
  const [open, setOpen] = useState<Record<string, boolean>>({
    education: false, family: false, settings: false,
    preferences: false, photos: false, hobbies: false,
  });
  const toggle = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }));

  function showModal(type: 'success' | 'error', title: string, msg: string) {
    setModal({ type, title, msg });
  }

  // ── Load lookup ──
  useEffect(() => {
    fetch(`${API}/api/profiles/lookup`).then(r => r.json()).then(setLookup).catch(() => {});
  }, []);

  // ── Load existing profile ──
  useEffect(() => {
    if (!profileId || !token) return;
    fetch(`${API}/api/profiles/${profileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const p = d.profile;
        if (!p) return;
        const pref = p.preferences ?? p.profilePreference ?? {};
        setForm({
          firstName: p.firstName ?? '', lastName: p.lastName ?? '', gender: p.gender ?? '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          maritalStatus: p.maritalStatus ?? '', height: p.height?.toString() ?? '',
          weight: p.weight?.toString() ?? '', bodyType: p.bodyType ?? '',
          physicalStatus: p.physicalStatus ?? 'NORMAL', bloodGroup: p.bloodGroup ?? '', aboutMe: p.aboutMe ?? '',
          religionId: p.religionId?.toString() ?? '', denomination: p.denomination ?? '',
          motherTongueId: p.motherTongueId?.toString() ?? '',
          eatingHabits: p.eatingHabits ?? [], smokingHabit: p.smokingHabit ?? '',
          drinkingHabit: p.drinkingHabit ?? '',
          nativeCountryId: p.nativeCountryId?.toString() ?? '',
          nativeCountryState: p.nativeCountryState ?? '', nativeCountryCity: p.nativeCountryCity ?? '',
          countryLivingId: p.countryLivingId?.toString() ?? '',
          countryLivingState: p.countryLivingState ?? '', countryLivingCity: p.countryLivingCity ?? '',
          citizenshipId: p.citizenshipId?.toString() ?? '',
          grewUpInCountryIds: Array.isArray(p.grewUpInCountryIds) ? p.grewUpInCountryIds : [],
          highestEducationId: p.highestEducationId?.toString() ?? '',
          employmentStatus: p.employmentStatus ?? '', occupationId: p.occupationId?.toString() ?? '',
          annualIncome: p.annualIncome?.toString() ?? '', currency: p.currency ?? 'LKR',
          fatherName: p.fatherName ?? '', fatherOccupationId: p.fatherOccupationId?.toString() ?? '',
          motherName: p.motherName ?? '', motherOccupationId: p.motherOccupationId?.toString() ?? '',
          noOfBrothers: p.noOfBrothers?.toString() ?? '', brothersMarried: p.brothersMarried?.toString() ?? '',
          noOfSisters: p.noOfSisters?.toString() ?? '', sistersMarried: p.sistersMarried?.toString() ?? '',
          aboutFamily: p.aboutFamily ?? '',
          profileVisibility: p.profileVisibility ?? 'ACTIVE',
          showPhoto: p.showPhoto ?? false, showFullAge: p.showFullAge ?? false,
          showFirstName: p.showFirstName ?? false, horoscopeAvailable: p.horoscopeAvailable ?? false,
          contactMethods: p.contactMethods ?? [], contactWhatsapp: p.contactWhatsapp ?? '',
          contactPhone: p.contactPhone ?? '', contactEmail: p.contactEmail ?? '',
          hobbies: p.hobbies ?? [], favMusic: p.favMusic ?? [], favMusicOther: p.favMusicOther ?? '',
          favSports: p.favSports ?? [], favSportsOther: p.favSportsOther ?? '', favFood: p.favFood ?? [],
          prefMinAge: pref.minAge?.toString() ?? '', prefMaxAge: pref.maxAge?.toString() ?? '',
          prefMinHeight: pref.minHeight?.toString() ?? '', prefMaxHeight: pref.maxHeight?.toString() ?? '',
          prefReligionIds: pref.religionIds ?? [], prefMotherTongueIds: pref.motherTongueIds ?? [],
          prefCitizenshipIds: pref.citizenshipIds ?? [], prefCountryLivingIds: pref.countryLivingIds ?? [],
          prefGrewUpInCountryIds: pref.grewUpInCountryIds ?? [],
          prefMaritalStatuses: pref.maritalStatuses ?? [], prefPhysicalStatuses: pref.physicalStatuses ?? [],
          prefEatingHabits: pref.eatingHabits ?? [], prefSmokingHabit: pref.smokingHabit ?? '',
          prefDrinkingHabit: pref.drinkingHabit ?? '', prefEducationId: pref.educationId?.toString() ?? '',
          prefOccupationId: pref.occupationId?.toString() ?? '',
          prefMinIncome: pref.minIncome?.toString() ?? '', prefMaxIncome: pref.maxIncome?.toString() ?? '',
          prefAboutPartner: pref.aboutPartner ?? '',
        });
        setPhotos(Array.isArray(p.photos) ? p.photos : []);
      })
      .catch(() => {});
  }, [profileId, token]);

  function set(k: keyof FormState, v: any) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k as string]; return n; });
  }
  function toggleArr(k: keyof FormState, v: string) {
    const arr = form[k] as string[];
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  }

  // ── react-select helpers ──
  const allOccs = lookup?.occupationGroups.flatMap(g => g.occupations) ?? [];
  const currencyOpts = buildCurrencyOptions(lookup?.countries ?? []);
  const toRS = (items: LookupItem[]) => items.map(i => ({ value: i.id, label: i.name }));
  const fromRS = (v: any) => v?.value ?? null;
  const rsVal = (items: LookupItem[], id?: number | null) => id ? { value: id, label: items.find(i => i.id === id)?.name ?? '' } : null;
  const rsStr = (opts: { value: string | number; label: string }[], v?: string | number | null) => v ? { value: v, label: opts.find(o => String(o.value) === String(v))?.label ?? String(v) } : null;
  const rsValMulti = (items: LookupItem[], ids: number[]) => ids.map(id => ({ value: id, label: items.find(i => i.id === id)?.name ?? String(id) }));
  const fromRSMulti = (v: any[]) => (v ?? []).map((o: any) => Number(o.value));

  // ── Build payload ──
  function buildPayload() {
    return {
      firstName: form.firstName, lastName: form.lastName, gender: form.gender,
      dateOfBirth: form.dateOfBirth, maritalStatus: form.maritalStatus,
      height: form.height ? parseFloat(form.height) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      bodyType: form.bodyType || null, physicalStatus: form.physicalStatus,
      bloodGroup: form.bloodGroup || null, aboutMe: form.aboutMe,
      createdByType: 'MATCHMAKER',
      religionId: form.religionId ? Number(form.religionId) : null,
      denomination: form.denomination, motherTongueId: form.motherTongueId ? Number(form.motherTongueId) : null,
      eatingHabits: form.eatingHabits, smokingHabit: form.smokingHabit || null, drinkingHabit: form.drinkingHabit || null,
      nativeCountryId: form.nativeCountryId ? Number(form.nativeCountryId) : null,
      nativeCountryState: form.nativeCountryState, nativeCountryCity: form.nativeCountryCity,
      countryLivingId: form.countryLivingId ? Number(form.countryLivingId) : null,
      countryLivingState: form.countryLivingState, countryLivingCity: form.countryLivingCity,
      citizenshipId: form.citizenshipId ? Number(form.citizenshipId) : null,
      grewUpInCountryIds: form.grewUpInCountryIds,
      highestEducationId: form.highestEducationId ? Number(form.highestEducationId) : null,
      employmentStatus: form.employmentStatus || null,
      occupationId: form.occupationId ? Number(form.occupationId) : null,
      annualIncome: form.annualIncome ? parseFloat(form.annualIncome) : null, currency: form.currency,
      fatherName: form.fatherName, fatherOccupationId: form.fatherOccupationId ? Number(form.fatherOccupationId) : null,
      motherName: form.motherName, motherOccupationId: form.motherOccupationId ? Number(form.motherOccupationId) : null,
      noOfBrothers: form.noOfBrothers ? parseInt(form.noOfBrothers) : null,
      brothersMarried: form.brothersMarried ? parseInt(form.brothersMarried) : null,
      noOfSisters: form.noOfSisters ? parseInt(form.noOfSisters) : null,
      sistersMarried: form.sistersMarried ? parseInt(form.sistersMarried) : null,
      aboutFamily: form.aboutFamily,
      profileVisibility: form.profileVisibility, showPhoto: form.showPhoto,
      showFullAge: form.showFullAge, showFirstName: form.showFirstName,
      horoscopeAvailable: form.horoscopeAvailable, contactMethods: form.contactMethods,
      contactWhatsapp: form.contactWhatsapp, contactPhone: form.contactPhone, contactEmail: form.contactEmail,
      hobbies: form.hobbies, favMusic: form.favMusic, favMusicOther: form.favMusicOther,
      favSports: form.favSports, favSportsOther: form.favSportsOther, favFood: form.favFood,
      preferences: {
        minAge: form.prefMinAge ? parseInt(form.prefMinAge) : null,
        maxAge: form.prefMaxAge ? parseInt(form.prefMaxAge) : null,
        minHeight: form.prefMinHeight ? parseInt(form.prefMinHeight) : null,
        maxHeight: form.prefMaxHeight ? parseInt(form.prefMaxHeight) : null,
        religionIds: form.prefReligionIds, motherTongueIds: form.prefMotherTongueIds,
        citizenshipIds: form.prefCitizenshipIds, countryLivingIds: form.prefCountryLivingIds,
        grewUpInCountryIds: form.prefGrewUpInCountryIds,
        maritalStatuses: form.prefMaritalStatuses, physicalStatuses: form.prefPhysicalStatuses,
        eatingHabits: form.prefEatingHabits, smokingHabit: form.prefSmokingHabit || null,
        drinkingHabit: form.prefDrinkingHabit || null,
        educationId: form.prefEducationId ? Number(form.prefEducationId) : null,
        occupationId: form.prefOccupationId ? Number(form.prefOccupationId) : null,
        minIncome: form.prefMinIncome ? parseFloat(form.prefMinIncome) : null,
        maxIncome: form.prefMaxIncome ? parseFloat(form.prefMaxIncome) : null,
        aboutPartner: form.prefAboutPartner,
      },
    };
  }

  // ── Validate basic fields ──
  function validateBasic(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.gender) e.gender = 'Gender is required';
    if (!form.dateOfBirth) {
      e.dateOfBirth = 'Date of birth is required';
    } else {
      const ageYears = Math.floor((Date.now() - new Date(form.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
      if (ageYears < 18) e.dateOfBirth = 'Must be at least 18 years old';
    }
    if (!form.maritalStatus) e.maritalStatus = 'Marital status is required';
    if (form.height) {
      const h = Number(form.height);
      if (h < HEIGHT_MIN + 1) e.height = `Height must be at least 4'1" (${HEIGHT_MIN + 1} cm) — please move the slider`;
    }
    setErrors(e);
    const keys = Object.keys(e);
    if (keys.length > 0) {
      // Scroll to the first error field
      setTimeout(() => {
        const el = document.getElementById(`field-${keys[0]}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return false;
    }
    return true;
  }

  // ── Save a section ──
  async function saveSection(sectionKey: string, validate?: () => boolean) {
    if (validate && !validate()) return;
    setSaving(sectionKey);
    try {
      const payload = buildPayload();
      const url = savedId ? `${API}/api/matchmaker/profiles/${savedId}` : `${API}/api/matchmaker/profiles`;
      const method = savedId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      const isNew = !savedId;
      if (isNew && data.profile?.id) setSavedId(data.profile.id);
      showModal('success', isNew ? 'Profile Created!' : 'Changes Saved!', isNew ? 'The profile has been created successfully. You can now fill in the remaining sections.' : 'Your changes have been saved successfully.');
    } catch (err: any) {
      showModal('error', 'Save Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(null);
    }
  }

  // ── Photo upload ──
  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length || !savedId || !token) return;
    setPhotoUploading(true);
    const fd = new FormData();
    Array.from(files).slice(0, 10 - photos.length).forEach(f => fd.append('photos', f));
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${savedId}/photos`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (res.ok) { setPhotos(prev => [...prev, ...data.photos]); showModal('success', 'Photos Uploaded!', `${data.photos.length} photo(s) have been uploaded successfully.`); }
      else showModal('error', 'Upload Failed', data.message || 'Could not upload photos. Please try again.');
    } catch { showModal('error', 'Upload Failed', 'Something went wrong. Please try again.'); }
    finally { setPhotoUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function deletePhoto(photoId: number) {
    if (!savedId || !token) return;
    const res = await fetch(`${API}/api/matchmaker/profiles/${savedId}/photos/${photoId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== photoId));
    else showModal('error', 'Delete Failed', 'Could not delete the photo. Please try again.');
  }

  async function setPhotoPrimary(photoId: number) {
    if (!savedId || !token) return;
    const res = await fetch(`${API}/api/matchmaker/profiles/${savedId}/photos/${photoId}/primary`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })));
    else showModal('error', 'Update Failed', 'Could not set the primary photo. Please try again.');
  }

  // ── Hobby groups ──
  const hobbyGroups = (lookup?.hobbyOptions ?? []).reduce<{ category: string; categoryLabel: string; categoryEmoji: string; items: HobbyOption[] }[]>((acc, h) => {
    const g = acc.find(x => x.category === h.category);
    if (g) g.items.push(h); else acc.push({ category: h.category, categoryLabel: h.categoryLabel, categoryEmoji: h.categoryEmoji, items: [h] });
    return acc;
  }, []);

  const needsBasicSave = !savedId;
  const lockedMsg = 'Save Basic Information first to unlock this section';

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-[#9A8A7A] text-sm mb-2 flex items-center gap-1 cursor-pointer bg-transparent border-none" style={{ fontFamily: "'Outfit',sans-serif" }}>← Back</button>
          <h1 style={{ fontFamily: "'Playfair Display',serif" }} className="text-2xl font-extrabold text-[#2A1A1A] m-0">
            {isEdit ? 'Edit Profile' : 'Add New Profile'}
          </h1>
          {savedId && <span className="text-xs text-[#9A8A7A] font-mono mt-0.5 block">Profile #{savedId}</span>}
        </div>
        <button
          onClick={() => router.push('/partners/dashboard/matchmaker')}
          className="text-sm text-[#9A8A7A] border border-[#F0E4D0] rounded-full px-4 py-2 cursor-pointer bg-white hover:bg-[#FFFBF7] transition-colors"
          style={{ fontFamily: "'Outfit',sans-serif" }}
        >
          View All Profiles
        </button>
      </div>

      {/* Modal */}
      {modal && <SaveModal modal={modal} onClose={() => setModal(null)} />}

      <div className="flex flex-col gap-4">

        {/* ══ SECTION 1: Basic Information (always open) ══ */}
        <Section title="Basic Information" icon="👤" alwaysOpen isOpen onToggle={() => {}} onSave={() => saveSection('basic', validateBasic)} saving={saving === 'basic'}>
          <div className="grid grid-cols-2 gap-4">
            <F label="First Name *" error={errors.firstName} id="field-firstName">
              <input className={inp} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. Priya" style={{ fontFamily: "'Outfit',sans-serif" }} />
            </F>
            <F label="Last Name *" error={errors.lastName} id="field-lastName">
              <input className={inp} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. Perera" style={{ fontFamily: "'Outfit',sans-serif" }} />
            </F>
          </div>

          <F label="Gender *" error={errors.gender} id="field-gender">
            <div className="grid grid-cols-2 gap-3">
              {[{ value: 'FEMALE', label: '🌸 Bride (Female)', bg: '#fce7f3', border: '#f9a8d4', text: '#be185d' }, { value: 'MALE', label: '💙 Groom (Male)', bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' }].map(opt => (
                <button key={opt.value} type="button" onClick={() => set('gender', opt.value)}
                  className="py-3 rounded-xl border-2 font-semibold text-sm cursor-pointer transition-all"
                  style={{ fontFamily: "'Outfit',sans-serif", background: form.gender === opt.value ? opt.bg : 'white', borderColor: form.gender === opt.value ? opt.border : '#F0E4D0', color: form.gender === opt.value ? opt.text : '#7A6A5A' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </F>

          <F label="Date of Birth *" error={errors.dateOfBirth} id="field-dateOfBirth">
            <DateOfBirthPicker value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} />
          </F>

          <F label="Marital Status *" error={errors.maritalStatus} id="field-maritalStatus">
            <RadioPills options={lookup?.maritalStatuses ?? []} value={form.maritalStatus} onChange={v => set('maritalStatus', v)} />
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F label="Height" error={errors.height} id="field-height">
              <HeightPicker value={form.height ? Number(form.height) : 165} onChange={v => set('height', String(v))} />
            </F>
            <div>
              <F label="Weight (kg)">
                <div className="flex items-center gap-3">
                  <input type="number" min={30} max={200} className={inp} value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="e.g. 60" style={{ fontFamily: "'Outfit',sans-serif", maxWidth: 140 }} />
                  <span className="text-sm text-[#9A8A7A]">kg</span>
                </div>
              </F>
              <F label="Physical Status">
                <RadioPills options={lookup?.physicalStatuses ?? []} value={form.physicalStatus} onChange={v => set('physicalStatus', v)} />
              </F>
              <F label="Blood Group">
                <RadioPills
                  options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
                  value={form.bloodGroup}
                  onChange={v => set('bloodGroup', v)}
                />
              </F>
            </div>
          </div>

          {lookup?.bodyTypes && lookup.bodyTypes.length > 0 && (
            <F label="Body Type">
              <BodyTypePicker value={form.bodyType} onChange={v => set('bodyType', v)} options={lookup.bodyTypes} />
            </F>
          )}

          <F label="About (min 50 chars)">
            <textarea className={inp} rows={4} value={form.aboutMe} onChange={e => set('aboutMe', e.target.value)}
              placeholder="Tell potential matches about this person…" style={{ fontFamily: "'Outfit',sans-serif", resize: 'vertical' }} />
            <p className={`text-xs mt-1 ${(form.aboutMe?.length || 0) < 50 ? 'text-[#E8735A]' : 'text-[#4ABEAA]'}`} style={{ fontFamily: "'Outfit',sans-serif" }}>
              {form.aboutMe?.length || 0} chars {(form.aboutMe?.length || 0) < 50 ? `(${50 - (form.aboutMe?.length || 0)} more needed)` : '✓'}
            </p>
          </F>
        </Section>

        {/* ══ SECTION 2: Religion & Language (always open) ══ */}
        <Section title="Religion & Language" icon="🙏" color="#7B8FE8" alwaysOpen isOpen onToggle={() => {}} onSave={() => saveSection('religion')} saving={saving === 'religion'} saveDisabled={needsBasicSave} saveDisabledMsg={lockedMsg}>
          <div className="grid grid-cols-2 gap-4">
            <F label="Religion">
              <Select options={toRS(lookup?.religions ?? [])} value={rsVal(lookup?.religions ?? [], form.religionId ? Number(form.religionId) : null)}
                onChange={v => set('religionId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Select religion…" isClearable />
            </F>
            <F label="Denomination">
              <input className={inp} value={form.denomination} onChange={e => set('denomination', e.target.value)} placeholder="e.g. Roman Catholic, Theravada" style={{ fontFamily: "'Outfit',sans-serif" }} />
            </F>
          </div>
          <F label="Mother Tongue">
            <Select options={toRS(lookup?.motherTongues ?? [])} value={rsVal(lookup?.motherTongues ?? [], form.motherTongueId ? Number(form.motherTongueId) : null)}
              onChange={v => set('motherTongueId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Select language…" isClearable />
          </F>
          <F label="Eating Habits">
            <CheckPills options={lookup?.eatingHabits ?? []} value={form.eatingHabits} onChange={v => set('eatingHabits', v)} />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Smoking"><RadioPills options={lookup?.smokingHabits ?? []} value={form.smokingHabit} onChange={v => set('smokingHabit', v)} /></F>
            <F label="Drinking"><RadioPills options={lookup?.drinkingHabits ?? []} value={form.drinkingHabit} onChange={v => set('drinkingHabit', v)} /></F>
          </div>
        </Section>

        {/* ══ SECTION 3: Location (always open) ══ */}
        <Section title="Location" icon="📍" color="#4ABEAA" alwaysOpen isOpen onToggle={() => {}} onSave={() => saveSection('location')} saving={saving === 'location'} saveDisabled={needsBasicSave} saveDisabledMsg={lockedMsg}>
          <div className="mb-4">
            <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>Native Country</div>
            <div className="grid grid-cols-3 gap-4">
              <F label="Country">
                <Select options={toRS(lookup?.countries ?? [])} value={rsVal(lookup?.countries ?? [], form.nativeCountryId ? Number(form.nativeCountryId) : null)}
                  onChange={v => set('nativeCountryId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Select country…" isClearable />
              </F>
              <F label="State / Province">
                <input className={inp} value={form.nativeCountryState} onChange={e => set('nativeCountryState', e.target.value)} placeholder="e.g. Western Province" style={{ fontFamily: "'Outfit',sans-serif" }} />
              </F>
              <F label="City">
                <input className={inp} value={form.nativeCountryCity} onChange={e => set('nativeCountryCity', e.target.value)} placeholder="e.g. Colombo" style={{ fontFamily: "'Outfit',sans-serif" }} />
              </F>
            </div>
          </div>
          <div className="mb-4">
            <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>Currently Living In</div>
            <div className="grid grid-cols-3 gap-4">
              <F label="Country">
                <Select options={toRS(lookup?.countries ?? [])} value={rsVal(lookup?.countries ?? [], form.countryLivingId ? Number(form.countryLivingId) : null)}
                  onChange={v => set('countryLivingId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Select country…" isClearable />
              </F>
              <F label="State / Province">
                <input className={inp} value={form.countryLivingState} onChange={e => set('countryLivingState', e.target.value)} placeholder="e.g. Greater London" style={{ fontFamily: "'Outfit',sans-serif" }} />
              </F>
              <F label="City">
                <input className={inp} value={form.countryLivingCity} onChange={e => set('countryLivingCity', e.target.value)} placeholder="e.g. London" style={{ fontFamily: "'Outfit',sans-serif" }} />
              </F>
            </div>
          </div>
          <F label="Citizenship">
            <Select options={toRS(lookup?.countries ?? [])} value={rsVal(lookup?.countries ?? [], form.citizenshipId ? Number(form.citizenshipId) : null)}
              onChange={v => set('citizenshipId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Select citizenship…" isClearable />
          </F>
          <F label="Grew Up In (multiple countries)">
            <Select
              isMulti
              options={toRS(lookup?.countries ?? [])}
              value={rsValMulti(lookup?.countries ?? [], form.grewUpInCountryIds)}
              onChange={v => set('grewUpInCountryIds', fromRSMulti(v as any[]))}
              styles={rsStyles}
              placeholder="Select countries where they grew up…"
            />
          </F>
        </Section>

        {/* ══ SECTION 4: Education & Career (collapsible) ══ */}
        <Section title="Education & Career" icon="🎓" color="#7B8FE8" isOpen={open.education} onToggle={() => toggle('education')} onSave={() => saveSection('education')} saving={saving === 'education'} saveDisabled={needsBasicSave} saveDisabledMsg={lockedMsg}>
          <F label="Highest Education">
            <Select options={toRS(lookup?.educations ?? [])} value={rsVal(lookup?.educations ?? [], form.highestEducationId ? Number(form.highestEducationId) : null)}
              onChange={v => set('highestEducationId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Select education…" isClearable />
          </F>
          <F label="Employment Status">
            <RadioPills options={lookup?.employmentStatuses ?? []} value={form.employmentStatus} onChange={v => set('employmentStatus', v)} />
          </F>
          <F label="Occupation">
            <Select options={toRS(allOccs)} value={rsVal(allOccs, form.occupationId ? Number(form.occupationId) : null)}
              onChange={v => set('occupationId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Search occupation…" isClearable />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Annual Income">
              <input type="number" className={inp} value={form.annualIncome} onChange={e => set('annualIncome', e.target.value)} placeholder="e.g. 1200000" style={{ fontFamily: "'Outfit',sans-serif" }} />
            </F>
            <F label="Currency">
              <Select options={currencyOpts} value={rsStr(currencyOpts, form.currency)} onChange={v => set('currency', (v as any)?.value ?? 'LKR')} styles={rsStyles} placeholder="Currency…" />
            </F>
          </div>
        </Section>

        {/* ══ SECTION 5: Family Background (collapsible) ══ */}
        <Section title="Family Background" icon="👨‍👩‍👧" color="#E8735A" isOpen={open.family} onToggle={() => toggle('family')} onSave={() => saveSection('family')} saving={saving === 'family'} saveDisabled={needsBasicSave} saveDisabledMsg={lockedMsg}>
          <div className="grid grid-cols-2 gap-4">
            <F label="Father's Name">
              <input className={inp} value={form.fatherName} onChange={e => set('fatherName', e.target.value)} placeholder="e.g. Ravi Perera" style={{ fontFamily: "'Outfit',sans-serif" }} />
            </F>
            <F label="Father's Occupation">
              <Select options={toRS(allOccs)} value={rsVal(allOccs, form.fatherOccupationId ? Number(form.fatherOccupationId) : null)}
                onChange={v => set('fatherOccupationId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Select…" isClearable />
            </F>
            <F label="Mother's Name">
              <input className={inp} value={form.motherName} onChange={e => set('motherName', e.target.value)} placeholder="e.g. Seetha Perera" style={{ fontFamily: "'Outfit',sans-serif" }} />
            </F>
            <F label="Mother's Occupation">
              <Select options={toRS(allOccs)} value={rsVal(allOccs, form.motherOccupationId ? Number(form.motherOccupationId) : null)}
                onChange={v => set('motherOccupationId', fromRS(v)?.toString() ?? '')} styles={rsStyles} placeholder="Select…" isClearable />
            </F>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <F label="Brothers"><input type="number" min={0} className={inp} value={form.noOfBrothers} onChange={e => set('noOfBrothers', e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
            <F label="Married"><input type="number" min={0} className={inp} value={form.brothersMarried} onChange={e => set('brothersMarried', e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
            <F label="Sisters"><input type="number" min={0} className={inp} value={form.noOfSisters} onChange={e => set('noOfSisters', e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
            <F label="Married"><input type="number" min={0} className={inp} value={form.sistersMarried} onChange={e => set('sistersMarried', e.target.value)} style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
          </div>
          <F label="About Family">
            <textarea className={inp} rows={3} value={form.aboutFamily} onChange={e => set('aboutFamily', e.target.value)} placeholder="Describe family background…" style={{ fontFamily: "'Outfit',sans-serif", resize: 'vertical' }} />
          </F>
        </Section>

        {/* ══ SECTION 6: Profile Settings (collapsible) ══ */}
        <Section title="Profile Settings & Visibility" icon="⚙️" color="#9A8A7A" isOpen={open.settings} onToggle={() => toggle('settings')} onSave={() => saveSection('settings')} saving={saving === 'settings'} saveDisabled={needsBasicSave} saveDisabledMsg={lockedMsg}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>Visibility</div>
              <RadioPills options={[{ value: 'ACTIVE', label: '● Active' }, { value: 'HIDDEN', label: '● Hidden' }]} value={form.profileVisibility} onChange={v => set('profileVisibility', v)} />
            </div>
            <div>
              <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>Show on Profile</div>
              <Toggle checked={form.showPhoto} onChange={v => set('showPhoto', v)} label="Show Photo Publicly" />
              <Toggle checked={form.showFullAge} onChange={v => set('showFullAge', v)} label="Show Full Age" />
              <Toggle checked={form.showFirstName} onChange={v => set('showFirstName', v)} label="Show First Name" />
              <Toggle checked={form.horoscopeAvailable} onChange={v => set('horoscopeAvailable', v)} label="Horoscope Available" />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>Contact Methods</div>
            <CheckPills options={[{ value: 'WHATSAPP', label: '📱 WhatsApp' }, { value: 'PHONE', label: '📞 Phone' }, { value: 'EMAIL', label: '✉ Email' }]} value={form.contactMethods} onChange={v => set('contactMethods', v)} />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {form.contactMethods.includes('WHATSAPP') && <F label="WhatsApp"><input className={inp} value={form.contactWhatsapp} onChange={e => set('contactWhatsapp', e.target.value)} placeholder="+94xxxxxxxxx" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>}
            {form.contactMethods.includes('PHONE') && <F label="Phone"><input className={inp} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+94xxxxxxxxx" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>}
            {form.contactMethods.includes('EMAIL') && <F label="Email"><input type="email" className={inp} value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="email@example.com" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>}
          </div>
        </Section>

        {/* ══ SECTION 7: Partner Preferences (collapsible) ══ */}
        <Section title="Partner Preferences" icon="💕" color="#E85AA3" isOpen={open.preferences} onToggle={() => toggle('preferences')} onSave={() => saveSection('preferences')} saving={saving === 'preferences'} saveDisabled={needsBasicSave} saveDisabledMsg={lockedMsg}>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <F label="Min Age"><input type="number" min={18} max={80} className={inp} value={form.prefMinAge} onChange={e => set('prefMinAge', e.target.value)} placeholder="18" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
            <F label="Max Age"><input type="number" min={18} max={80} className={inp} value={form.prefMaxAge} onChange={e => set('prefMaxAge', e.target.value)} placeholder="40" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
            <F label="Min Height (cm)"><input type="number" className={inp} value={form.prefMinHeight} onChange={e => set('prefMinHeight', e.target.value)} placeholder="150" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
            <F label="Max Height (cm)"><input type="number" className={inp} value={form.prefMaxHeight} onChange={e => set('prefMaxHeight', e.target.value)} placeholder="190" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Religion(s)">
              <Select isMulti options={toRS(lookup?.religions ?? [])} value={rsValMulti(lookup?.religions ?? [], form.prefReligionIds)}
                onChange={v => set('prefReligionIds', fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any religion…" />
            </F>
            <F label="Mother Tongue(s)">
              <Select isMulti options={toRS(lookup?.motherTongues ?? [])} value={rsValMulti(lookup?.motherTongues ?? [], form.prefMotherTongueIds)}
                onChange={v => set('prefMotherTongueIds', fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any language…" />
            </F>
            <F label="Citizenship(s)">
              <Select isMulti options={toRS(lookup?.countries ?? [])} value={rsValMulti(lookup?.countries ?? [], form.prefCitizenshipIds)}
                onChange={v => set('prefCitizenshipIds', fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any citizenship…" />
            </F>
            <F label="Country Living In">
              <Select isMulti options={toRS(lookup?.countries ?? [])} value={rsValMulti(lookup?.countries ?? [], form.prefCountryLivingIds)}
                onChange={v => set('prefCountryLivingIds', fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any country…" />
            </F>
            <F label="Grew Up In">
              <Select isMulti options={toRS(lookup?.countries ?? [])} value={rsValMulti(lookup?.countries ?? [], form.prefGrewUpInCountryIds)}
                onChange={v => set('prefGrewUpInCountryIds', fromRSMulti(v as any[]))} styles={rsStyles} placeholder="Any country…" />
            </F>
          </div>
          <F label="Marital Status">
            <CheckPills options={lookup?.maritalStatuses ?? []} value={form.prefMaritalStatuses} onChange={v => set('prefMaritalStatuses', v)} />
          </F>
          <F label="Physical Status">
            <CheckPills options={lookup?.physicalStatuses ?? []} value={form.prefPhysicalStatuses} onChange={v => set('prefPhysicalStatuses', v)} />
          </F>
          <F label="Eating Habits">
            <CheckPills options={lookup?.eatingHabits ?? []} value={form.prefEatingHabits} onChange={v => set('prefEatingHabits', v)} />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Smoking"><RadioPills options={[{ value: '', label: 'Any' }, ...(lookup?.smokingHabits ?? [])]} value={form.prefSmokingHabit} onChange={v => set('prefSmokingHabit', v)} /></F>
            <F label="Drinking"><RadioPills options={[{ value: '', label: 'Any' }, ...(lookup?.drinkingHabits ?? [])]} value={form.prefDrinkingHabit} onChange={v => set('prefDrinkingHabit', v)} /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Min Income"><input type="number" className={inp} value={form.prefMinIncome} onChange={e => set('prefMinIncome', e.target.value)} placeholder="e.g. 500000" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
            <F label="Max Income"><input type="number" className={inp} value={form.prefMaxIncome} onChange={e => set('prefMaxIncome', e.target.value)} placeholder="e.g. 5000000" style={{ fontFamily: "'Outfit',sans-serif" }} /></F>
          </div>
          <F label="About Ideal Partner">
            <textarea className={inp} rows={3} value={form.prefAboutPartner} onChange={e => set('prefAboutPartner', e.target.value)} placeholder="Describe the kind of partner they're looking for…" style={{ fontFamily: "'Outfit',sans-serif", resize: 'vertical' }} />
          </F>
        </Section>

        {/* ══ SECTION 8: Photos (collapsible) ══ */}
        <Section title="Photos" icon="📸" color="#7B8FE8" isOpen={open.photos} onToggle={() => toggle('photos')} onSave={() => {}} saving={false} saveDisabled>
          {!savedId ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📷</div>
              <div className="text-sm text-[#9A8A7A]" style={{ fontFamily: "'Outfit',sans-serif" }}>Save Basic Information first to unlock photo uploads.</div>
            </div>
          ) : (
            <>
              {photos.length < 10 && (
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-[#F0E4D0] rounded-xl p-6 text-center cursor-pointer hover:border-[#F4A435]/60 hover:bg-[#FFFBF7] transition-all mb-4">
                  <div className="text-3xl mb-2">📸</div>
                  <div className="font-bold text-[#5A4A3A] text-sm" style={{ fontFamily: "'Outfit',sans-serif" }}>{photoUploading ? 'Uploading…' : 'Click to upload photos'}</div>
                  <div className="text-xs text-[#9A8A7A] mt-1" style={{ fontFamily: "'Outfit',sans-serif" }}>Up to {10 - photos.length} more · JPG, PNG · Max 8MB</div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoUpload(e.target.files)} />
                </div>
              )}
              {photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {photos.map(ph => (
                    <div key={ph.id} className={`relative rounded-xl overflow-hidden border-2 aspect-square bg-[#F5F0EB] ${ph.isPrimary ? 'border-[#F4A435]' : 'border-[#F0E4D0]'}`}>
                      <img src={ph.imageUrl} alt="" className="w-full h-full object-cover" />
                      {ph.isPrimary && <div className="absolute top-1.5 left-1.5 bg-[#F4A435] text-white text-[10px] font-bold rounded-full px-2 py-0.5">⭐ Main</div>}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/55 flex gap-1 p-1.5 justify-center">
                        {!ph.isPrimary && <button type="button" onClick={() => setPhotoPrimary(ph.id)} className="bg-[#F4A435]/90 text-white text-[10px] font-semibold rounded px-1.5 py-1 cursor-pointer">⭐</button>}
                        <button type="button" onClick={() => deletePhoto(ph.id)} className="bg-[#E8735A]/90 text-white text-[10px] font-semibold rounded px-1.5 py-1 cursor-pointer">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-[#9A8A7A] py-4" style={{ fontFamily: "'Outfit',sans-serif" }}>No photos yet — upload above</div>
              )}
            </>
          )}
        </Section>

        {/* ══ SECTION 9: Hobbies & Interests (collapsible, LAST) ══ */}
        <Section title="Hobbies & Interests" icon="🎨" color="#E85AA3" isOpen={open.hobbies} onToggle={() => toggle('hobbies')} onSave={() => saveSection('hobbies')} saving={saving === 'hobbies'} saveDisabled={needsBasicSave} saveDisabledMsg={lockedMsg}>
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>Hobbies</div>
              <div className="flex flex-col gap-3">
                {hobbyGroups.map(g => (
                  <div key={g.category} className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                    <div className="text-sm font-bold text-[#2A1A1A] mb-2.5" style={{ fontFamily: "'Outfit',sans-serif" }}>{g.categoryEmoji} {g.categoryLabel}</div>
                    <TagPills items={g.items} selected={form.hobbies} onToggle={v => toggleArr('hobbies', v)} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>🎵 Favourite Music</div>
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <TagPills items={lookup?.musicOptions ?? []} selected={form.favMusic} onToggle={v => toggleArr('favMusic', v)} />
                <input className={`${inp} mt-3`} value={form.favMusicOther} onChange={e => set('favMusicOther', e.target.value)} placeholder="Other music (e.g. Fusion, Blues…)" style={{ fontFamily: "'Outfit',sans-serif" }} />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>🏆 Sports</div>
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <TagPills items={lookup?.sportOptions ?? []} selected={form.favSports} onToggle={v => toggleArr('favSports', v)} />
                <input className={`${inp} mt-3`} value={form.favSportsOther} onChange={e => set('favSportsOther', e.target.value)} placeholder="Other sports…" style={{ fontFamily: "'Outfit',sans-serif" }} />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-[#5A4A3A] uppercase tracking-widest mb-3" style={{ fontFamily: "'Outfit',sans-serif" }}>🍛 Favourite Food</div>
              <div className="bg-[#FFFBF7] rounded-xl border border-[#F0E4D0] p-4">
                <TagPills items={lookup?.foodOptions ?? []} selected={form.favFood} onToggle={v => toggleArr('favFood', v)} />
              </div>
            </div>
          </div>
        </Section>

      </div>

      {/* ── Sticky Bottom Bar ── */}
      <div
        className="sticky bottom-0 mt-6 -mx-1 px-1 pb-4 pt-3"
        style={{ background: 'linear-gradient(to top, #FFFBF7 70%, transparent)' }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Cancel */}
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full py-4 text-base font-bold transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
            style={{
              fontFamily: "'Outfit',sans-serif",
              flex: '0 0 auto',
              paddingLeft: '24px',
              paddingRight: '24px',
              background: 'transparent',
              border: '2px solid #E8735A',
              color: '#E8735A',
            }}
          >
            Cancel
          </button>

          {/* Save / Create */}
          <button
            type="button"
            onClick={() => saveSection('basic', validateBasic)}
            disabled={!!saving}
            className="rounded-full py-4 text-base font-bold text-white transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            style={{
              fontFamily: "'Outfit',sans-serif",
              flex: 1,
              background: 'linear-gradient(135deg, #F4A435 0%, #E8735A 100%)',
              boxShadow: '0 4px 20px rgba(244,164,53,0.35)',
            }}
          >
            {saving ? '⏳ Saving…' : (savedId ? '💾 Save All Changes' : '🚀 Create Profile')}
          </button>

          {/* View — only shown after profile exists */}
          {savedId && (
            <button
              type="button"
              onClick={() => router.push(`/partners/dashboard/matchmaker/profiles/${savedId}`)}
              className="rounded-full py-4 text-base font-bold transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
              style={{
                fontFamily: "'Outfit',sans-serif",
                flex: '0 0 auto',
                paddingLeft: '24px',
                paddingRight: '24px',
                background: 'transparent',
                border: '2px solid #F4A435',
                color: '#F4A435',
              }}
            >
              View
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
